.env file needs to have the Supabase organization’s publishable key as well as its URL. .env.example provides a .env template for reference when setting up the project locally.

This project uses Lucide icons for simplicity and consistency. View options for icons and find their associated names here: https://lucide.dev/icons/
To use an icon, import the icon with its name from 'lucide-react-native' and implement using <Icon icon={<IconName>} />

For address autofill:
- sign up at geoapify.com
- set project's API key to EXPO_PUBLIC_GEOAPIFY_KEY in .env

Gmail REST API details:
- This is a capstone project and is not being published with a real launch so we can have up to 100 users added as "test users" in the Cloud Console
- Users will be warned that "Google hasn't verified this app" and have to click continue
- Users must reconnect weekly because refresh tokens expire after 7 days (as opposed to tokens that only expire when they are revoked if this app were truly published)
- Pro: Google's app verification for a published app costs money and requires an annual third-party security assessment which we are not completing for this capstone project
