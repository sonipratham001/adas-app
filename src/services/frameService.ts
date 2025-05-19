import { sendFrameToVPS } from './vpsDetectionService.ts';
import { getAuth } from '@react-native-firebase/auth';

// Define the response type to match the backend's output
type FrameResponse = {
  commands: string[];
  audioUrl: string | null;
};

// Main function to process frames locally
export const processFrame = async (framePath: string): Promise<FrameResponse> => {
  try {
    // Validate file presence (already handled in useCameraRecording.ts, but added for safety)
    if (!framePath) {
      console.error(`[${new Date().toISOString()}] No frame file provided`);
      throw new Error('No frame file provided');
    }

    console.log(`[${new Date().toISOString()}] Processing frame: ${framePath}`);

    // Authenticate user and get token
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.error(`[${new Date().toISOString()}] No authentication token`);
      throw new Error('No authentication token');
    }

    // Send frame to VPS for detection
    const detections = await sendFrameToVPS(framePath, token);

    // Check for VPS errors
    if (detections.includes('Error detecting') || detections.includes('Frame file not found')) {
      console.error(`[${new Date().toISOString()}] VPS processing failed: ${detections}`);
      throw new Error('Failed to process frame on VPS');
    }

    // Since we're using react-native-tts in the app, we don't need an audio URL
    // Audio will be handled directly in useCameraRecording.ts
    const audioUrl = null;

    console.log(`[${new Date().toISOString()}] Frame processed successfully:`, { commands: detections, audioUrl });
    return { commands: detections, audioUrl };
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error processing frame:`, {
      message: error.message,
      framePath,
    });
    throw error; // Let the caller handle the error
  }
};