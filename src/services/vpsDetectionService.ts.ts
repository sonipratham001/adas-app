import axios from 'axios';
import RNFS from 'react-native-fs';

// Use the ML model VPS URL
const VPS_URL = 'http://148.66.155.196:5050';

export const sendFrameToVPS = async (framePath: string, token: string): Promise<string[]> => {
  try {
    // Check if the frame file exists
    const exists = await RNFS.exists(framePath);
    if (!exists) {
      console.error('Frame file not found:', framePath);
      return ['Frame file not found'];
    }

    // Read the frame file as base64
    const base64Image = await RNFS.readFile(framePath, 'base64');

    // Send the frame to the VPS
    const response = await axios.post(VPS_URL, {
      image: `data:image/jpeg;base64,${base64Image}`,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response data exists
    if (!response.data) {
      console.error('Invalid VPS response: No data received');
      return ['Invalid response from VPS'];
    }

    // Extract available parameters
    const { eye_closed, head_direction, microsleep, yawn, danger_level, fatigue_score, phone_detected } = response.data;

    // Construct commands array based on available VPS data
    const commands: string[] = [];

    if (eye_closed !== undefined) {
      const eyeState = eye_closed ? 'closed' : 'open';
      commands.push(`Eyes ${eyeState}`);
    }
    if (head_direction !== undefined) {
      commands.push(`Head direction: ${head_direction.toLowerCase()}`);
    }
    if (microsleep !== undefined && microsleep) {
      commands.push('Microsleep detected');
    }
    if (yawn !== undefined && yawn) {
      commands.push('stay alert');
    }
    if (danger_level !== undefined) {
      commands.push(`Danger level: ${danger_level}`);
    }
    if (fatigue_score !== undefined) {
      commands.push(`Fatigue score: ${fatigue_score}`);
    }
    if (phone_detected !== undefined && phone_detected) {
      commands.push('Phone detected');
    }

    console.log('VPS detection successful:', commands);
    return commands;
  } catch (error: any) {
    console.error('❌ Error sending frame to VPS:', error.message, error.stack);
    return ['Error detecting'];
  }
};