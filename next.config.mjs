
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
             {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
             {
                protocol: 'https',
                hostname: 'avatar.vercel.sh',
            }
        ]
    }
};

export default nextConfig;
