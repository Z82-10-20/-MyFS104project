import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import collection from './config.js';
import CartItem from './cart.js';
import Product from './product.js';
import session from 'express-session';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { Admin, connectDB } from "./adminSchema.js";
import mongoose from 'mongoose';


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
const hashPassword = async () => {
  const password = process.env.ADMIN_PASSWORD; // Assuming you set this in your .env
  const saltRounds = 10;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password: ", hashedPassword);
    // Store this hashed password securely or use it to update the admin record in your database
  } catch (error) {
    // console.error("Error hashing password: ", error);
  }
};

hashPassword();


const adminCredentials = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};





app.post('/login', async (req, res) => {
    try {
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;

        // Check for admin login
        const admin = await Admin.findOne({ email: enteredEmail });

        if (admin) {
            const isPasswordMatch = await bcrypt.compare(enteredPassword, admin.password);

            if (isPasswordMatch) {
                // Set admin session variables
                req.session.isAdmin = true;
                req.session.user = { email: enteredEmail, isAdmin: true };
                return res.redirect('/admindashboard');
            } else {
                return res.render('login', { error: 'Invalid admin credentials' });
            }
        }

        // Regular user login process
        const user = await collection.findOne({ email: enteredEmail });
        if (!user) {
            return res.render('usernotfound');
        }

        const isUserPasswordMatch = await bcrypt.compare(enteredPassword, user.password);
        if (isUserPasswordMatch) {
            req.session.user = user;
            req.session.userId = user._id;
            req.session.userGreeting = user.name || '';
            return res.redirect('/dashboard');
        } else {
            return res.render('wrongpassword');
        }
    } catch (error) {
        console.error(error);
        return res.render('error', { error: 'An error occurred during login' });
    }
});

app.get('/admindashboard', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            const users = await collection.find().exec(); // Fetch all users from the database
            const admins = await Admin.find().exec(); // Fetch admin-specific data if needed
            res.render('admindashboard', { users, admins });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.render('error', { error: 'Error fetching data' });
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/createadmin', async (req, res) => {
  // Extract admin member data from the request
  const adminUsername = req.body.adminUsername;
  const adminEmail = req.body.adminEmail;
  const adminPassword = req.body.adminPassword;

  // Hash the admin member's password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  // Create a new admin member instance using the Admin model
  const newAdmin = new Admin({
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
  });

  try {
    // Save the new admin member to the database
    await newAdmin.save();
    console.log('Admin member created:', newAdmin);
    // Redirect to a success page or any other desired route
    res.redirect('/admindashboard');
  } catch (error) {
    console.error('Error creating admin member:', error);
    // Redirect to an error page or handle the error as needed
    res.redirect('/error'); // You can replace '/error' with the appropriate error route
  }
});

// Update the remove admin route
app.post('/removeadmin/:adminEmail', async (req, res) => {
  // Check if the user has the necessary authorization (e.g., logged in as admin)
  if (!req.session.isAdmin) {
    return res.redirect('/login'); // Redirect to the login page or handle unauthorized access as needed
  }

  const adminEmail = req.params.adminEmail;

  try {
    // Find the admin member by email and remove them from the database
    const removedAdmin = await Admin.findOneAndDelete({ email: adminEmail }); // Use the Admin model
    if (!removedAdmin) {
      console.log('Admin member not found');
      return res.redirect('/admindashboard'); // Redirect to the admin dashboard or any other appropriate route
    }
    
    console.log('Admin member removed:', removedAdmin);

    // Redirect to the admin dashboard or any other appropriate route
    res.redirect('/admindashboard');
  } catch (error) {
    console.error('Error removing admin member:', error);
    // Redirect to an error page or handle the error as needed
    res.redirect('/error'); // You can replace '/error' with the appropriate error route
  }
});





app.post('/createuser', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            const { username, email, password } = req.body;
            const existingUser = await collection.findOne({ email: email });
            if (existingUser) {
                res.send('User already exists with that email.');
            } else {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const newUser = new collection({ 
                    name: username, 
                    email: email, 
                    password: hashedPassword 
                });
                await newUser.save();
                res.redirect('/admindashboard');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            res.send('An error occurred while creating the user.');
        }
    } else {
        res.redirect('/login');
    }
});

app.post('/deleteuser/:email', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            const userEmail = req.params.email;
            await collection.deleteOne({ email: userEmail });
            res.redirect('/admindashboard');
        } catch (error) {
            console.error('Error deleting user:', error);
            res.redirect('/admindashboard');
        }
    } else {
        res.redirect('/login');
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


app.get('/dashprofile', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const user = await collection.findById(req.session.userId);
        const imageName = user.profileImage || 'placeholder.png';
        res.render('dashprofile', { user, imageName });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).render('error', { message: "Error loading profile." });
    }
});




const imageDataPath = path.join(__dirname, 'imageData.json');
function readImageData() {
    try {
        const fileContents = fs.readFileSync(imageDataPath, 'utf8');
        if (fileContents.trim() === '') {
            return { imageName: 'placeholder.png' };
        }
        return JSON.parse(fileContents);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
             return { imageName: 'placeholder.png' };
        }
        throw error;
    }
}


// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads')); // Define your upload directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext); // Generate a unique filename for each uploaded file
  },
});

const upload = multer({ storage });

// Upload route
app.post('/uploads', upload.single('image'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  try {
   if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' }); }
    const userId = req.session.userId;
    const filename = req.file.filename;

    // Update the user's profileImage field in the database
    await collection.findByIdAndUpdate(userId, { $set: { profileImage: filename } });

    console.log(`File ${filename} successfully uploaded for user ${userId}`);
    res.redirect('/dashprofile'); // Redirect to the profile page or any other desired route
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});





// Photo delete route
app.delete('/delete-photo', async (req, res) => {
  if (!req.session.user || !req.session.userId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const userId = req.session.userId;
    const user = await collection.findById(userId);
    const existingImagePath = user.profileImage;

    if (existingImagePath && existingImagePath !== 'placeholder.png') {
      const imagePath = path.join(__dirname, 'public/uploads', existingImagePath);

      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('File deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error during file deletion:', err.message, 'Path:', imagePath);
      }
    }

    // Remove the profileImage field from the user document in the database
    await collection.findByIdAndUpdate(userId, { $unset: { profileImage: '' } });

    console.log('Photo deleted successfully');

    // Return a JSON response indicating success
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error in delete-photo route:', error);
    // Return a JSON response indicating an error
    res.status(500).json({ error: 'Error deleting photo' });
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


app.post('/logout', (req, res) => {
  try {
    if (req.session.user) {
      console.log('User logged out:', req.session.user.email);
      req.session.destroy();
    }
    res.redirect('/login');
  } catch (error) {
    console.error('Error during logout:', error);
    res.render('error');
  }
});

app.get('/cart', async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.userId;
      const user = await User.findById(userId).populate('cart.product');
      return res.render('cart', { user });
    }

    // If there is no user session, you can still render the cart page without user data
    return res.render('cart', { user: null });
  } catch (error) {
    console.error('Error fetching cart data:', error);
    res.render('error');
  }
});



app.post('/cart/add', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    try {
      const userId = req.session.userId;
      const { productId, quantity } = req.body;

      // Create a new cart item
      const cartItem = new CartItem({
        user: userId,
        product: productId,
        quantity: quantity,
      });

      // Save the cart item to the database
      await cartItem.save();

      // Add the cart item to the user's cart in the database
      const user = await User.findById(userId);
      user.cart.push(cartItem);
      await user.save();

      res.redirect('/cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.render('error');
    }
  }
});



app.post('/cart/remove', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    try {
      const userId = req.session.userId;
      const { cartItemId } = req.body;

      // Remove the item from the user's cart in the database
      await CartItem.findByIdAndRemove(cartItemId);

      res.redirect('/cart');
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.render('error');
    }
  }
});





const port = 3000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
