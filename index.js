import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import collection from './config.js';
import session from 'express-session';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  session({
    secret: 'your_secret_key', // Replace with a strong, secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  let data = {
    h1: 'Your One-Stop Shopping Destination',
  };
  res.render('home.ejs', { title: 'Home Page', ...data });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const data = {
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };

  const existingUser = await collection.findOne({ email: data.email });
  if (existingUser) {
    res.render('userexisted');
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;
    const userData = new collection(data);

    try {
      await userData.save();
      console.log(userData);
      res.render('success');
    } catch (error) {
      console.error(error);
      res.render('error');
    }
  }
});

app.post('/login', async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });

    if (!check) {
      res.render('usernotfound');
    } else {
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );

      if (isPasswordMatch) {
        req.session.user = check;
        req.session.userId = check._id;
        const user = await collection.findOne({ _id: check._id });

        if (user) {
          req.session.userGreeting = user.name;
        } else {
          req.session.userGreeting = '';
        }
        res.redirect('/dashboard');
      } else {
        res.render('wrongpassword');
      }
    }
  } catch (error) {
    console.error(error);
    res.render('wrongdetail');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    res.render('dashboard', {
      user: req.session.user,
      userGreeting: req.session.userGreeting || '',
    });
  }
});

app.get('/unsubscribe', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    res.render('unsubscribe', { user: req.session.user });
  }
});

app.get('/unsubscribeuser', (req, res) => {
  res.render('unsubscribeuser', { user: req.session.user });
});

app.post('/unsubscribe', async (req, res) => {
  if (req.session.userId) {
    const userId = req.session.userId;

    try {
      const user = req.session.user;
      await collection.findByIdAndDelete(userId);
      req.session.destroy();
      return res.render('unsubscribeuser', { user });
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }
  res.redirect('/unsubscribeuser');
});

app.get('/dashprofile', (req, res) => {
  if (!req.session.user) {
    res.render('usernotlogin');
  } else {
    res.render('dashprofile', { user: req.session.user });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4(); // Generate a unique fileId for the file
    cb(null, fileId + '-' + file.originalname);
  },
});

const upload = multer({ storage });
app.use(upload.single('newProfilePicture'));
app.post('/upload', upload.single('newProfilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
 console.log('req.file:', req.file);
    console.log('req.file.buffer:', req.file.buffer);
    const { originalname, buffer, mimetype } = req.file;
    const fileId = req.file.filename.split('-')[0]; // Extract the fileId from the filename

    if (!fileId || fileId.trim() === '') {
      return res.status(400).send('Invalid file data.');
    }

    const user = await collection.findById(req.session.userId);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    user.profilePicture = {
      fileId: fileId, // Assign the extracted ID
      filename: originalname,
      contentType: mimetype,
      data: buffer,
    };

    await user.save();

    const filePath = path.join(__dirname, 'uploads', `${fileId}-${originalname}`);
    await fsPromises.writeFile(filePath, buffer);

    res.redirect('/dashprofile');
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).send('Error uploading profile picture.');
  }
});

// ... (other routes and app setup)

// Make sure you have the correct route for serving profile pictures
// For example:
app.get('/profilePicture/:fileId', async (req, res) => {
  try {
    const user = await collection.findOne({ 'profilePicture.fileId': req.params.fileId });

    if (user && user.profilePicture && user.profilePicture.data) {
      res.contentType(user.profilePicture.contentType);
      res.send(user.profilePicture.data);
    } else {
      const filePath = path.join(__dirname, 'uploads', `${req.params.fileId}`);
      const fileData = await fsPromises.readFile(filePath);
      res.contentType(user.profilePicture.contentType); // Check if user.profilePicture.contentType exists
      res.send(fileData);
    }
  } catch (error) {
    console.error('Error serving profile picture:', error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/dashsetting', async (req, res) => {
  try {
    const userData = await collection.findOne({ _id: req.session.userId });
    const message = 'Change Your Details';
    res.render('dashsetting', { user: userData, message });
  } catch (error) {
    console.error('Error retrieving user settings:', error);
    res.render('error');
  }
});

app.post('/settings', async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentPassword = req.body.currentPassword;
    const updatedUserData = {
      name: req.body.username,
      email: req.body.email,
    };

    if (req.body.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
      updatedUserData.password = hashedPassword;
    }

    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.redirect('/dashboard?message=User not found');
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return res.redirect('/dashboard?message=Incorrect current password');
    }

    await collection.findOneAndUpdate(
      { _id: userId },
      { $set: updatedUserData },
      { new: true }
    );

    res.redirect('/dashboard?message=Settings updated successfully');
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.render('error');
  }
});

app.get('/dashzoomluigi', (req, res) => {
  res.render('dashzoomluigi');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
