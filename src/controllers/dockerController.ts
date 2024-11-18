import docker from 'dockerode';
import fetch from 'node-fetch';
import type { Request, Response } from 'express';

const client = new docker();

const imageName = 'bigjack325/exoflex';
const tag = 'latest';
const containerName = 'exoflex-app';

// Helper function to follow progress during Docker operations
const followProgress = (stream: any) =>
    new Promise((resolve, reject) => {
        client.modem.followProgress(stream, (err, output) => {
            if (err) return reject(err);
            resolve(output);
        });
    });

// Check for image updates
export const checkImageUpdate = async (req: Request, res: Response) => {
    try {
        console.log('Starting checkImageUpdate function...');
        
        // Log image name and tag
        // const imageName = process.env.IMAGE_NAME || 'your-image-name';
        // const tag = process.env.IMAGE_TAG || 'latest';
        console.log(`Image Name: ${imageName}`);
        console.log(`Tag: ${tag}`);

        // Step 1: Get local image digest
        console.log('Fetching local image digest...');
        const localImage = client.getImage(`${imageName}:${tag}`);
        const { RepoDigests } = await localImage.inspect();
        console.log(`RepoDigests from local image: ${JSON.stringify(RepoDigests)}`);
        const localDigest = RepoDigests?.[0]?.split('@')[1] || '';
        console.log(`Local Digest: ${localDigest}`);

        // Step 2: Fetch remote image digest
        console.log('Fetching remote image digest from Docker Hub...');
        const url = `https://registry.hub.docker.com/v2/repositories/${imageName}/tags/${tag}`;
        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url);
        console.log(`HTTP Response Status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch remote image info: ${response.statusText}`);
        }

        const remoteImageInfo = await response.json();
        console.log(`Remote Image Info: ${JSON.stringify(remoteImageInfo)}`);
        const remoteDigest = remoteImageInfo.digest || '';
        console.log(`Remote Digest: ${remoteDigest}`);

        // Step 3: Compare digests
        const updateAvailable = localDigest !== remoteDigest;
        console.log(`Update Available: ${updateAvailable}`);

        // Step 4: Send response
        res.json({
            updateAvailable,
            localDigest,
            remoteDigest,
        });
        console.log('Response sent successfully.');
    } catch (error) {
        console.error('Error checking image updates:', error.message);
        res.status(500).json({ error: 'Failed to check image updates' });
    }
};

// Execute image update and redeployment
export const executeImageUpdate = async (req: Request, res: Response) => {
    try {
        // Stop and remove the container if it exists
        const container = client.getContainer(containerName);
        try {
            await container.stop();
            console.log(`Container ${containerName} stopped successfully.`);
        } catch (err) {
            console.warn(`Container ${containerName} was not running or could not be stopped.`);
        }

        try {
            await container.remove();
            console.log(`Container ${containerName} removed successfully.`);
        } catch (err) {
            console.warn(`Container ${containerName} could not be removed.`);
        }

        // Pull the latest image
        console.log(`Pulling the latest image for ${imageName}:${tag}...`);
        const pullStream = await client.pull(`${imageName}:${tag}`);
        await followProgress(pullStream);
        console.log(`Image pulled successfully.`);

        // Redeploy the container
        console.log(`Redeploying container ${containerName}...`);
        const newContainer = await client.createContainer({
            Image: `${imageName}:${tag}`,
            name: containerName,
            Tty: true,
            HostConfig: {
                PortBindings: {
                    '3000/tcp': [{ HostPort: '3000' }],
                },
            },
        });
        await newContainer.start();
        console.log(`Container ${containerName} redeployed successfully.`);

        res.json({ message: 'Container updated and redeployed successfully' });
    } catch (error) {
        console.error('Error during image update or redeployment:', error);
        res.status(500).json({ error: 'Failed to update or redeploy container' });
    }
};