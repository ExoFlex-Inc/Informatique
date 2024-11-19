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
        // Get local image digest
        const localImage = client.getImage(`${imageName}:${tag}`);
        const { RepoDigests } = await localImage.inspect();
        const localDigest = RepoDigests?.[0]?.split('@')[1] || '';

        // Fetch remote image digest from Docker Hub
        const response = await fetch(`https://registry.hub.docker.com/v2/repositories/${imageName}/tags/${tag}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch remote image info: ${response.statusText}`);
        }
        const remoteImageInfo = await response.json();
        const remoteDigest = remoteImageInfo.digest || '';

        const updateAvailable = localDigest !== remoteDigest;

        res.json({
            updateAvailable,
            localDigest,
            remoteDigest,
        });
    } catch (error) {
        console.error('Error checking image updates:', error);
        res.status(500).json({ error: 'Failed to check image updates' });
    }

};

// Execute image update and redeployment
// export const executeImageUpdate = async (req: Request, res: Response) => {
//     console.log('Starting the image update and redeployment process...');
//     try {
//         // Step 1: Stop the container
//         console.log('Attempting to stop the container...');
//         const container = client.getContainer(containerName);
//         try {
//             await container.stop();
//             console.log(`Container ${containerName} stopped successfully.`);
//         } catch (err) {
//             console.warn(`Container ${containerName} was not running or could not be stopped.`, err.message);
//         }

//         // Step 2: Remove the container
//         console.log('Attempting to remove the container...');
//         try {
//             await container.remove();
//             console.log(`Container ${containerName} removed successfully.`);
//         } catch (err) {
//             console.warn(`Container ${containerName} could not be removed.`, err.message);
//         }

//         // Step 3: Pull the latest image
//         console.log(`Pulling the latest image: ${imageName}:${tag}...`);
//         try {
//             const pullStream = await client.pull(`${imageName}:${tag}`);
//             console.log('Image pull started...');
//             await followProgress(pullStream);
//             console.log('Image pulled successfully.');
//         } catch (err) {
//             console.error(`Error pulling the latest image ${imageName}:${tag}:`, err.message);
//             throw err; // Re-throw to handle it in the catch block below
//         }

//         // Step 4: Redeploy the container
//         console.log(`Redeploying container ${containerName} with image ${imageName}:${tag}...`);
//         try {
//             const newContainer = await client.createContainer({
//                 Image: `${imageName}:${tag}`,
//                 name: containerName,
//                 Tty: true,
//                 HostConfig: {
//                     PortBindings: {
//                         '3000/tcp': [{ HostPort: '3000' }],
//                     },
//                 },
//             });
//             console.log('Container created successfully.');
//             await newContainer.start();
//             console.log(`Container ${containerName} started successfully.`);
//         } catch (err) {
//             console.error(`Error redeploying container ${containerName}:`, err.message);
//             throw err;
//         }

//         console.log('Image update and redeployment process completed successfully.');
//         res.json({ message: 'Container updated and redeployed successfully' });
//     } catch (error) {
//         console.error('Error during image update or redeployment process:', error.message);
//         res.status(500).json({ error: 'Failed to update or redeploy container' });
//     } finally {
//         console.log('Image update process finished (success or error).');
//     }
// };

export const executeImageUpdate = async (req: Request, res: Response) => {
    console.log('Starting the image update process...');
    try {
        // Step 1: Pull the latest image
        console.log(`Pulling the latest image: ${imageName}:${tag}...`);
        try {
            const pullStream = await client.pull(`${imageName}:${tag}`);
            console.log('Image pull started...');
            await followProgress(pullStream);
            console.log('Image pulled successfully.');
        } catch (err) {
            console.error(`Error pulling the latest image ${imageName}:${tag}:`, err.message);
            throw err; // Re-throw to handle it in the catch block below
        }

        // Step 2: Restart the container
        console.log(`Restarting container ${containerName} to use the updated image...`);
        const container = client.getContainer(containerName);

        try {
            // Restart the container (Docker will use the updated image)
            await container.restart();
            console.log(`Container ${containerName} restarted successfully.`);
        } catch (err) {
            console.error(`Error restarting container ${containerName}:`, err.message);
            throw err;
        }

        res.json({ message: 'Container updated and restarted successfully' });
    } catch (error) {
        console.error('Error during image update process:', error.message);
        res.status(500).json({ error: 'Failed to update container' });
    } finally {
        console.log('Image update process finished (success or error).');
    }
};