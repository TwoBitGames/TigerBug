# OAuth Login Providers

Let people log in with Google, GitHub, Discord, or other services instead of creating yet another password.

## Setting it up

1. Go to Admin Dashboard → OAuth
2. For each provider you want (Google, GitHub, etc.):
    - **Client ID & Secret**: Get these from the provider's developer console
    - **Scope**: What permissions to ask for (provider-specific)
    - **Callback URL**: Copy this and paste it into the provider's settings
    - **Enable/Disable**: Turn providers on and off
3. Hit Save

## How it works

The login page pulls the list of enabled providers and shows nice branded buttons for each one.

Each provider stores its config in the database, so you can manage everything through the admin UI.
