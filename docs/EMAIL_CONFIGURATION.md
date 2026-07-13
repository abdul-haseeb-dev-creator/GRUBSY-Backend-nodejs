# Email Service Configuration

This document explains how to configure the email service for sending password reset emails and other transactional emails.

## Environment Variables

Add these variables to your `.env` file:

```bash
# Email Service Configuration
EMAIL_SERVICE_ENABLED=true

# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL, 25 for unencrypted)
SMTP_SECURE=false                 # Set to 'true' for port 465 (SSL), 'false' for port 587 (TLS)
SMTP_USER=your-email@gmail.com    # SMTP username/email
SMTP_PASSWORD=your-app-password    # SMTP password or app-specific password
SMTP_REJECT_UNAUTHORIZED=true     # Set to 'false' only for self-signed certificates (not recommended)

# Email Sender Configuration
FROM_EMAIL=noreply@grubsy.com      # Email address to send from (defaults to SMTP_USER if not set)
FROM_NAME=Grubsy Platform          # Display name for sender (defaults to "Grubsy Platform")
```

## Common SMTP Providers

### Gmail

```bash
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password  # Generate at: https://myaccount.google.com/apppasswords
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Grubsy Platform
```

**Note:** Gmail requires an [App Password](https://support.google.com/accounts/answer/185833) if you have 2FA enabled.

### Outlook/Office 365

```bash
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
FROM_NAME=Grubsy Platform
```

### SendGrid

```bash
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Grubsy Platform
```

### AWS SES (via SMTP)

```bash
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Use your AWS region
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
FROM_EMAIL=verified-email@yourdomain.com
FROM_NAME=Grubsy Platform
```

### Custom SMTP Server

```bash
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Grubsy Platform
```

## Testing Email Configuration

### Development Mode (Logging Only)

If `EMAIL_SERVICE_ENABLED` is not set to `true`, the service will log reset codes to the console instead of sending emails. This is useful for development:

```bash
# Don't set EMAIL_SERVICE_ENABLED, or set it to false
# Reset codes will be logged to console
```

### Production Mode

Set `EMAIL_SERVICE_ENABLED=true` and configure all SMTP variables. The service will attempt to send emails via SMTP.

## Troubleshooting

### Email not sending

1. **Check logs**: Look for error messages in the server logs
2. **Verify credentials**: Ensure `SMTP_USER` and `SMTP_PASSWORD` are correct
3. **Check port**: Verify the port matches your SMTP provider (587 for TLS, 465 for SSL)
4. **Test connection**: Try connecting with a mail client using the same credentials
5. **Check firewall**: Ensure your server can connect to the SMTP server on the specified port

### Gmail-specific issues

- **"Less secure app access"**: Gmail no longer supports this. Use an App Password instead.
- **App Password**: Generate at https://myaccount.google.com/apppasswords
- **2FA Required**: Gmail requires 2FA to be enabled to generate App Passwords

### Common Error Messages

- **"Invalid login"**: Check `SMTP_USER` and `SMTP_PASSWORD`
- **"Connection timeout"**: Check `SMTP_HOST` and `SMTP_PORT`, verify firewall rules
- **"Certificate error"**: Set `SMTP_REJECT_UNAUTHORIZED=false` only for self-signed certs (not recommended)

## Security Best Practices

1. **Never commit credentials**: Keep `.env` file out of version control
2. **Use App Passwords**: For Gmail and similar services, use app-specific passwords
3. **Use environment-specific configs**: Different SMTP settings for dev/staging/production
4. **Monitor email logs**: Check logs regularly for failed email attempts
5. **Rate limiting**: Email sending is already rate-limited via the password reset endpoints

## Example .env Configuration

```bash
# Production Email Configuration
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@grubsy.com
SMTP_PASSWORD=your-app-password-here
SMTP_REJECT_UNAUTHORIZED=true
FROM_EMAIL=noreply@grubsy.com
FROM_NAME=Grubsy Platform
```
