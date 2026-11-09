.env file needs to have the Supabase organization’s publishable key as well as its URL. .env.example provides a .env template for reference when setting up the project locally.

To do:
	Download extensions
		ESLint, Prettier, Expo Tools (official)
	Add .env file

This project uses Lucide icons for simplicity and consistency. View options for icons and find their associated names here: https://lucide.dev/icons/
To use an icon, import the icon with its name from 'lucide-react-native' and implement using <Icon icon={<IconName>} />

For address autofill:
- sign up at geoapify.com
- set project's API key to EXPO_PUBLIC_GEOAPIFY_KEY in .env
