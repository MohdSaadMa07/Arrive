import ProfileImage from '../models/profileImageModel.js';

// @desc    Upload or update profile image
// @route   POST /api/upload-profile-image
// @access  Public
export const uploadProfileImage = async (req, res) => {
  try {
    const { image, userId, email } = req.body;

    if (!image || !userId || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: image, userId, and email are required' 
      });
    }

    // Validate base64 image format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be a valid base64 image string'
      });
    }

    // Convert Base64 to Buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

    // Check if image already exists for this user
    let profileImage = await ProfileImage.findOne({ userId });
    if (profileImage) {
      profileImage.image = imageBuffer;  // store as Buffer
      profileImage.email = email;
      profileImage.updatedAt = Date.now();
      await profileImage.save();

      return res.status(200).json({ 
        success: true,
        imageId: profileImage._id,
        message: 'Profile image updated successfully'
      });
    }

    // Create new profile image
    profileImage = new ProfileImage({
      userId,
      email,
      image: imageBuffer
    });

    await profileImage.save();

    res.status(201).json({ 
      success: true,
      imageId: profileImage._id,
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload image',
      details: error.message 
    });
  }
};

// @desc    Get profile image by user ID
// @route   GET /api/profile-image/:userId
// @access  Public
export const getProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    const profileImage = await ProfileImage.findOne({ userId });

    if (!profileImage) {
      return res.status(404).json({ 
        success: false,
        error: 'Profile image not found' 
      });
    }

    // Convert Buffer to Base64 for frontend
    const imageBase64 = `data:image/jpeg;base64,${profileImage.image.toString('base64')}`;

    res.status(200).json({
      success: true,
      imageUrl: imageBase64,
      imageId: profileImage._id,
      createdAt: profileImage.createdAt
    });

  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile image',
      details: error.message 
    });
  }
};
