use clap::Parser;
use std::process;

#[derive(Parser)]
#[command(name = "CrashHandler")]
#[command(about = "A crash report submission tool for TigerBug")]
#[command(version = "1.0.0")]
struct Args {
    #[arg(long, value_name = "PROJECT_ID")]
    id: u32,

    #[arg(long, value_name = "URL")]
    url: String,

    #[arg(long, value_name = "BASE64_DATA")]
    report: String,

    #[arg(long, value_name = "VERSION")]
    version: Option<String>,

    #[arg(long, value_name = "OS")]
    os: Option<String>,

    #[arg(long, value_name = "BASE64_USER_STORY")]
    user_story: Option<String>,

    #[arg(long, short)]
    verbose: bool,
}

#[derive(serde::Serialize)]
struct CrashReportPayload {
    id: u32,
    report: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    os: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    user_story: Option<String>,
}

async fn submit_crash_report(args: &Args) -> anyhow::Result<()> {
    if args.verbose {
        println!("TigerBug CrashHandler");
        println!("Project ID: {}", args.id);
        println!("Server URL: {}", args.url);
        println!("Report size: {} characters", args.report.len());
        if let Some(ref user_story) = args.user_story {
            println!("User story size: {} characters", user_story.len());
        }
    }

    let engine = base64::engine::general_purpose::STANDARD;
    match base64::Engine::decode(&engine, &args.report) {
        Ok(decoded) => {
            if args.verbose {
                println!("Base64 data is valid ({} bytes decoded)", decoded.len());
            }
        }
        Err(e) => {
            println!("Error: Invalid base64 data - {}", e);
            process::exit(1);
        }
    }

    if let Some(ref user_story) = args.user_story {
        match base64::Engine::decode(&engine, user_story) {
            Ok(decoded) => {
                if args.verbose {
                    println!("User story base64 data is valid ({} bytes decoded)", decoded.len());
                }
            }
            Err(e) => {
                println!("Error: Invalid base64 user story data - {}", e);
                process::exit(1);
            }
        }
    }

    let api_url = format!("{}/api/crash-reports/submit", args.url.trim_end_matches('/'));
    
    if args.verbose {
        println!("Submitting to: {}", api_url);
    }

    let payload = CrashReportPayload {
        id: args.id,
        report: args.report.clone(),
        version: args.version.clone(),
        os: args.os.clone(),
        user_story: args.user_story.clone(),
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("CrashHandler/1.0.0")
        .build()?;

    let response = client
        .post(&api_url)
        .json(&payload)
        .send()
        .await?;

    let status = response.status();
    let response_text = response.text().await?;

    if status.is_success() {
        if args.verbose {
            println!("Crash report submitted successfully!");
            
            if let Ok(response_json) = serde_json::from_str::<serde_json::Value>(&response_text) {
                if let Some(crash_id) = response_json.get("crash_report_id") {
                    println!("Crash Report ID: {}", crash_id);
                }
            }
        } else {
            println!("Crash report submitted successfully.");
        }
    } else if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        println!("Rate limit exceeded. Please wait before submitting another crash report.");
        println!("Rate limits: 1 per hour, 4 per day per IP address.");
        process::exit(1);
    } else if status == reqwest::StatusCode::BAD_REQUEST {
        println!("Bad request. Please check your parameters:");
        
        if let Ok(error_json) = serde_json::from_str::<serde_json::Value>(&response_text) {
            if let Some(errors) = error_json.get("errors") {
                println!("   Validation errors: {}", errors);
            } else if let Some(error) = error_json.get("error") {
                println!("   Error: {}", error);
            }
        } else {
            println!("   {}", response_text);
        }
        process::exit(1);
    } else if status == reqwest::StatusCode::NOT_FOUND {
        println!("Project not found. Please check the project ID ({}).", args.id);
        process::exit(1);
    } else {
        println!("Failed to submit crash report. HTTP {}", status);
        if args.verbose {
            println!("Response: {}", response_text);
        }
        process::exit(1);
    }

    Ok(())
}

fn print_usage_examples() {
    println!("Basic usage:");
    println!("  CrashHandler --id 1 --url http://localhost:5173 --report \"VGVzdCByZXBvcnQ=\"");
    println!();
    println!("With additional context:");
    println!("  CrashHandler --id 1 --url http://localhost:5173 --report \"VGVzdCByZXBvcnQ=\" \\");
    println!("    --version \"1.2.3\" --os \"Windows 10\"");
    println!();
    println!("With user story:");
    println!("  CrashHandler --id 1 --url http://localhost:5173 --report \"VGVzdCByZXBvcnQ=\" \\");
    println!("    --user-story \"SSB3YXMgdHJ5aW5nIHRvIG9wZW4gYSBmaWxl\"");
    println!();
    println!("Verbose output:");
    println!("  CrashHandler --id 1 --url http://localhost:5173 --report \"VGVzdCByZXBvcnQ=\" --verbose");
}

fn validate_url(url: &str) -> bool {
    url.starts_with("http://") || url.starts_with("https://")
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    if !validate_url(&args.url) {
        println!("Error: URL must start with http:// or https://");
        println!("   Provided: {}", args.url);
        process::exit(1);
    }

    if args.id == 0 {
        println!("Error: Project ID must be greater than 0");
        process::exit(1);
    }

    if args.report.is_empty() {
        println!("Error: Report data cannot be empty");
        print_usage_examples();
        process::exit(1);
    }

    if let Err(e) = submit_crash_report(&args).await {
        if args.verbose {
            println!("Error submitting crash report: {:#}", e);
        } else {
            println!("Failed to submit crash report. Use --verbose for more details.");
        }
        
        process::exit(1);
    }
}
