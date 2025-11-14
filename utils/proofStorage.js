const fs = require('fs').promises;
const path = require('path');

// Save proofs to JSON files so we can inspect them later
// Useful for debugging and testing before going to production
exports.saveProof = async (proof, paymentId) => {
  try {
    const proofsDir = path.join(__dirname, '../proofs');

    // Make sure the proofs directory exists
    await fs.mkdir(proofsDir, { recursive: true });

    // Create a unique filename with the payment ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `proof_${paymentId}_${timestamp}.json`;
    const filepath = path.join(proofsDir, filename);

    // Write the proof as pretty-printed JSON
    await fs.writeFile(filepath, JSON.stringify(proof, null, 2), 'utf8');

    console.log(`Proof saved to: proofs/${filename}`);
    return filepath;

  } catch (error) {
    console.error('Error saving proof:', error.message);
    throw error;
  }
};

// Load a specific proof file if you need to inspect or reuse it
exports.loadProof = async (filename) => {
  try {
    const filepath = path.join(__dirname, '../proofs', filename);
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading proof:', error.message);
    throw error;
  }
};

// Get a list of all proof files we've saved
exports.listProofs = async () => {
  try {
    const proofsDir = path.join(__dirname, '../proofs');
    const files = await fs.readdir(proofsDir);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    // If the directory doesn't exist yet, just return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};
