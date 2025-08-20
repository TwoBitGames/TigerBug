# Email Setup

TigerBug sends emails for account verification, notifications, and other important stuff. Here's how to get it working.

## What needs email
- New account verification 
- Welcome messages
- Issue and comment notifications
- Assignment alerts
- Test emails (to make sure everything works)

## Setting it up
Go to Admin Dashboard → SMTP Configuration and fill in:
- **Host**: Your email server (like smtp.gmail.com)
- **Port**: Usually 465 for secure connections
- **Username & Password**: Your email credentials
- **From Address**: What shows up as the sender
- **Use TLS**: Check this unless you have certificate issues

Hit save and TigerBug will test the connection. Check the logs to see if it worked.

## Testing
Use the test email form in the admin panel to make sure everything's working before your users need it.

## When things go wrong
| Problem | Usually means | Try this |
|---------|-------|-----|
| Connection timeout | Firewall or wrong server | Test with `nc -vz yourhost 465` |
| Certificate errors | Self-signed or bad SSL | Uncheck "Use TLS" or fix your certificates |
| Authentication failed | Wrong username/password | Double-check your credentials |

Most email providers have specific setup guides - Gmail, Outlook, etc. all work fine.
