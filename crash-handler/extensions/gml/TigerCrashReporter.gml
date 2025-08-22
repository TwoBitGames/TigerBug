global.tiger_server_url = "";
global.tiger_project_id = 0;
global.tiger_version = "";

#define tiger_set_server
/// @description Set the server URL for crash reporting
/// @param {string} url The server URL (must include http:// or https://)
var url = argument0;

if (!string_starts_with(url, "http://") && !string_starts_with(url, "https://")) {
    show_debug_message("TigerCrashReporter Error: URL must start with http:// or https://");
    return false;
}

if (string_char_at(url, string_length(url)) == "/") {
    url = string_copy(url, 1, string_length(url) - 1);
}

global.tiger_server_url = url;
return true;

#define tiger_set_project_id
/// @description Set the project ID for crash reporting
/// @param {real} project_id The project ID (must be > 0)
var project_id = argument0;

if (project_id <= 0) {
    show_debug_message("TigerCrashReporter Error: Project ID must be greater than 0");
    return false;
}

global.tiger_project_id = project_id;
return true;

#define tiger_set_version
/// @description Set the version string for crash reporting
/// @param {string} version The version string
global.tiger_version = argument0;
return true;

#define tiger_send_report
/// @description Send a crash report to the server
/// @param {string} crash_data The crash data (will be base64 encoded automatically)
/// @param {string} user_story [Optional] User story describing what the user was doing when the crash occurred (will be base64 encoded automatically)
var crash_data = argument0;
var user_story = "";

if (argument_count >= 2) {
    user_story = argument1;

    if (argument1 == 0) {
        user_story = "";
    }
}

if (global.tiger_server_url == "") {
    show_debug_message("TigerCrashReporter Error: Server URL not set. Call tiger_set_server() first.");
    return -1;
}

if (global.tiger_project_id <= 0) {
    show_debug_message("TigerCrashReporter Error: Project ID not set. Call tiger_set_project_id() first.");
    return -1;
}

if (crash_data == "") {
    show_debug_message("TigerCrashReporter Error: Crash data cannot be empty.");
    return -1;
}

var encoded_data = base64_encode(crash_data);

var api_url = global.tiger_server_url + "/api/crash-reports/submit";

var headers_map = ds_map_create();
ds_map_add(headers_map, "Content-Type", "application/json");
ds_map_add(headers_map, "User-Agent", "TigerCrashReporter-GameMaker/1.0.0");

var payload_map = ds_map_create();
ds_map_add(payload_map, "id", global.tiger_project_id);
ds_map_add(payload_map, "report", encoded_data);

if (global.tiger_version != "") {
    ds_map_add(payload_map, "version", global.tiger_version);
}

if (user_story != "") {
    var encoded_user_story = base64_encode(user_story);
    ds_map_add(payload_map, "user_story", encoded_user_story);
}

var os_info = "";
switch (os_type) {
    case os_windows:
        os_info = "Windows";
        break;
    case os_macosx:
        os_info = "macOS";
        break;
    case os_linux:
        os_info = "Linux";
        break;
    case os_android:
        os_info = "Android";
        break;
    case os_ios:
        os_info = "iOS";
        break;
    default:
        os_info = "Unknown";
        break;
}
ds_map_add(payload_map, "os", os_info);

var json_payload = json_encode(payload_map);

var request_id = http_request(api_url, "POST", headers_map, json_payload);

ds_map_destroy(headers_map);
ds_map_destroy(payload_map);

return request_id;