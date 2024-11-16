import docker from "dockerode";
import fetch from "node-fetch";
import type { Request, Response } from "express";

const client = new docker();

const imageName = "bigjack325/exoflex";
const tag = "latest";
const containerName = "exoflex-app";

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
    const localDigest = RepoDigests?.[0]?.split("@")[1] || "";

    // Fetch remote image digest from Docker Hub
    const response = await fetch(
      `https://registry.hub.docker.com/v2/repositories/${imageName}/tags/${tag}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch remote image info: ${response.statusText}`,
      );
    }
    const remoteImageInfo = await response.json();
    const remoteDigest = remoteImageInfo.digest || "";

    const updateAvailable = localDigest !== remoteDigest;

    res.json({
      updateAvailable,
      localDigest,
      remoteDigest,
    });
  } catch (error) {
    console.error("Error checking image updates:", error);
    res.status(500).json({ error: "Failed to check image updates" });
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
      console.warn(
        `Container ${containerName} was not running or could not be stopped.`,
      );
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
          "3000/tcp": [{ HostPort: "3000" }],
        },
      },
    });
    await newContainer.start();
    console.log(`Container ${containerName} redeployed successfully.`);

    res.json({ message: "Container updated and redeployed successfully" });
  } catch (error) {
    console.error("Error during image update or redeployment:", error);
    res.status(500).json({ error: "Failed to update or redeploy container" });
  }
};
