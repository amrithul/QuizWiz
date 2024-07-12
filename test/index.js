const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const mongoose = require("mongoose");



const app = express();
const PORT = 3000;

// Connection URI
const uri = 'mongodb://localhost:27017';
// Database Name
const db2Name = 'quizDB';
mongoose.connect('mongodb://localhost:27017/quizDB',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

// Define mongoose schema for User
const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    role: String
});

// Define mongoose model for User
const User = mongoose.model("User", userSchema);

// Define mongoose schema for Group
const groupSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    teacherEmail: { type: String, required: true },
    members: [String],
    quizzes: [String]
});
groupSchema.index({ groupName: 1, teacherEmail: 1 }, { unique: true });

// Define mongoose model for Group
const Group = mongoose.model("Group", groupSchema);

// Define mongoose schema for Quiz
const quizSchema = new mongoose.Schema({
    quizName: { type: String, required: true },
    questions: [String]
});
const Quiz = mongoose.model("Quiz", quizSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Function to generate random alphanumeric string
function generateQuizCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Routes

app.post("/login", async(req,res)=>{
    var firstname = req.body.firstName;
    var lastname = req.body.lastName;
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.tors
    const collection = db.collection('users');
    const user = await collection.findOne({ email : email});

    if(user){
        return res.send('<script>alert("Email already exists"); window.location.href = "/signup.html"; </script>');
    }

    
    var data = {
        "firstname": firstname,
        "lastname": lastname,
        "email" : email,
        "password" : password,
        "role": role,
    };

    db.collection('users').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log("Record Inserted Successfully");
    });

    return res.redirect('login.html');

});

app.post("/userprofile", async (req,res)=>{
    var emaill = req.body.emaillog;
    var password = req.body.passwordlog;
    var result;
    const collection = db.collection('users');
    const user = await collection.findOne({ email : emaill});
    
    try{
        result = await User.findOne({email: emaill});
    }
    catch(err){
        console.log('User does not exist');
    }
    console.log(result);

    if(result){
        if(emaill === 'admin@gmail.com'){
            if(password === 'password'){
                return res.redirect('admin.html');
            }
            else{
                console.log('INVALID USERNAME OR PASSWORD');
                return res.redirect('login.html');
            }
        }
        else{
            if(result.password === password){
                if(user.role == 'student'){
                    return res.redirect('userprofile.html');
                }
                else if(user.role == 'teacher'){
                    return res.redirect('teacherprofile.html');
                }
            }
            else{
                console.log('INVALID USERNAME OR PASSWORD');
                return res.redirect('login.html');
            }
        }
    }
    else{
        console.log('INVALID USERNAME OR PASSWORD');
        return res.redirect('login.html');
    } 
});

app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    });
    return res.redirect('login.html');
}).listen(3000);

app.post('/saveQuiz', async (req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');
        const teachersCollection = db.collection('users');
        
        // Extract quiz data from the request body
        const { quizName, questionsData, teacherEmail } = req.body;

        // Generate a unique quiz code
        const quizCode = generateQuizCode(6); // Generate a 6-character quiz code
        
        // Parse the questions data
        const parsedQuestions = JSON.parse(questionsData);
        

        // Insert the quiz data into the database
        const inserted = await collection.insertOne({ 
            quizCode, 
            quizName, 
            teacherEmail, // Add teacher's email to the quiz document
            questions: parsedQuestions
        });

        await teachersCollection.updateOne(
            { email: teacherEmail },
            {
                $addToSet: { attendedQuizzes: quizCode } // Add quiz code if not already present
            }
        );

        // Send response with quiz details
        res.redirect('/quizcreated.html');

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error saving quiz', error });
    }
});


app.post('/takeQuiz', async (req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');
        
        const { quizCode } = req.body;

        // Find the quiz based on the provided quiz code
        const quiz = await collection.findOne({ quizCode });

        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }
        

        // Send the quiz data to the client
        res.status(200).json({ quiz });
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error taking quiz', error });
    }
});



app.post('/submitQuiz', async (req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');
        const studentsCollection = db.collection('users');

        const { quizCode, participantEmail } = req.body; // Extract participant email from request body
        const quiz = await collection.findOne({ quizCode });
        const user = await studentsCollection.findOne({ email: participantEmail });

        if (!quiz) {
            res.status(404).json({ message: 'Quiz not found' });
            return;
        }

        const submittedAnswers = req.body;

        let score = 0;
        const submittedAnswersWithQuestion = {}; // Object to store submitted answers with question number
        quiz.questions.forEach((question, index) => {
            const questionNumber = index + 1;
            const submittedAnswer = submittedAnswers[`question${index}`]; // Get submitted answer for this question
            submittedAnswersWithQuestion[`Question ${questionNumber}`] = submittedAnswer; // Store submitted answer with question number for display
            if (question.correctAnswer && submittedAnswer === question.correctAnswer.toString()) {
                score++;
            } else if (question.answer && submittedAnswer === question.answer) {
                score++;
            }
        });

        // Calculate time taken (assuming it's already submitted in seconds)
        const timeTaken = req.body.timeTaken;

        // Check if participants array exists, if not, initialize it
        if (!quiz.participants) {
            quiz.participants = [];
        }

        // Push participant's information into the participants array
        quiz.participants.push({
            email: participantEmail,
            name: user.firstname,
            score: score,
            timeTaken: timeTaken
        });

        // Update the quiz document with the new participant information
        await collection.updateOne(
            { quizCode },
            {
                $set: {
                    participants: quiz.participants
                }
            }
        );

        await studentsCollection.updateOne(
            { email: participantEmail },
            {
                $addToSet: { attendedQuizzes: quizCode } // Add quiz code if not already present
            }
        );

        // Redirect to the quiz result page with quiz code, score, and submitted answers as query parameters
        res.redirect(`/result.html?quizCode=${quizCode}&score=${score}&submittedAnswers=${encodeURIComponent(JSON.stringify(submittedAnswersWithQuestion))}&completionTime=${timeTaken}`);
        
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error });
    }
});



// Route to fetch quizzes attended by the user
app.post('/fetchQuizzes', async (req, res) => {
    try {
        const userEmail = req.body.userEmail;
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');

        // Find quizzes where the user's email exists in participants array
        const quizzes = await collection.find({
            $or: [
                { 'participants.email': userEmail }, // User participated in the quiz
                { teacherEmail: userEmail } // User is the teacher who created the quiz
            ]
        }).toArray();
        
        res.status(200).json({ quizzes });
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error });
    }
});



// Route to create a new group
app.post('/createGroup', async (req, res) => {
    const { groupName, teacherEmail } = req.body;
    try {
        // Create a new group in the database
        await Group.create({ groupName, teacherEmail, members: [] });
        res.json({ message: 'Group created successfully' });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue) {
            // Duplicate key error, groupName and teacherEmail combination already exists
            res.status(400).json({ message: 'Group with the same name already exists for this teacher.' });
        } else {
            console.error('Error creating group:', error);
            res.status(500).json({ message: 'Error creating group. Please try again.' });
        }
    }
});


// Route to fetch all groups for the logged-in teacher
app.get('/groups', async (req, res) => {
    const teacherEmail = req.query.teacherEmail;
    try {
        // Fetch all groups from the database for the logged-in teacher
        const groups = await Group.find({ teacherEmail });
        res.json({ groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Error fetching groups. Please try again.' });
    }
});

// Route to fetch all students
app.get('/students', async (req, res) => {
    try {
        // Fetch all students from the database
        const students = await User.find({});
        res.json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error fetching students. Please try again.' });
    }
});

// Route to add multiple students to a group
app.post('/addStudentsToGroup', async (req, res) => {
    const { groupId, students } = req.body;
    try {
        // Find the group by groupId and update its members array with selected students
        await Group.findOneAndUpdate({ _id: groupId }, { $addToSet: { members: { $each: students } } });
        res.json({ message: 'Students added to group successfully' });
    } catch (error) {
        console.error('Error adding students to group:', error);
        res.status(500).json({ message: 'Error adding students to group. Please try again.' });
    }
});



// Route to remove a student from a group

app.post('/removeStudentFromGroup', async (req, res) => {
    const { groupId, studentEmail } = req.body;
    try {
        // Find the group by groupId
        const group = await Group.findOne({ _id: groupId });

        // Check if group exists
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove the student from the group's members list
        const lowerCaseStudentEmail = studentEmail.toLowerCase(); // Convert email to lowercase
        group.members = group.members.filter(member => member.toLowerCase() !== lowerCaseStudentEmail);

        // Save the updated group
        await group.save();

        res.json({ message: 'Student removed from group successfully' });
    } catch (error) {
        console.error('Error removing student from group:', error);
        res.status(500).json({ message: 'Error removing student from group. Please try again.' });
    }
});




// Route to delete a group
app.post('/deleteGroup', async (req, res) => {
    const { groupId } = req.body;
    try {
        // Find the group by groupId and delete it
        await Group.findByIdAndDelete(groupId);
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Error deleting group. Please try again.' });
    }
});


// Route to assign a quiz to a group
app.post('/assignQuiz', async (req, res) => {
    try {
        const { groupName, quizCode } = req.body;

        // Find the group by name
        const group = await Group.findOne({ groupName });
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Check if the quiz is already assigned to the group
        if (group.quizzes.includes(quizCode)) {
            return res.status(400).json({ message: 'Quiz is already assigned to this group.' });
        }

        // Add the quiz code to the group's assigned quizzes
        group.quizzes.push(quizCode);
        await group.save();

        res.status(200).json({ message: 'Quiz assigned to group successfully.' });
    } catch (error) {
        console.error('Error assigning quiz to group:', error);
        res.status(500).json({ message: 'Error assigning quiz to group. Please try again.' });
    }
});


// Route to remove a quiz from a group
app.post('/removeQuiz', async (req, res) => {
    try {
        const { groupName, quizCode } = req.body;

        // Find the group by name
        const group = await Group.findOne({ groupName });
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Check if the quiz is assigned to the group
        if (!group.quizzes.includes(quizCode)) {
            return res.status(400).json({ message: 'Quiz is not assigned to this group.' });
        }

        // Remove the quiz code from the group's assigned quizzes
        group.quizzes = group.quizzes.filter(code => code !== quizCode);
        await group.save();

        res.status(200).json({ message: 'Quiz removed from group successfully.' });
    } catch (error) {
        console.error('Error removing quiz from group:', error);
        res.status(500).json({ message: 'Error removing quiz from group. Please try again.' });
    }
});

// Route to fetch quizzes created by the teacher
app.get('/quizzes', async (req, res) => {
    try {
        const teacherEmail = req.query.teacherEmail;
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');

        // Find quizzes where the teacher's email matches
        const quizzes = await collection.find({ teacherEmail }).toArray();
        
        res.status(200).json({ quizzes });
        client.close();
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Error fetching quizzes. Please try again.' });
    }
});

// Route to fetch user information
app.post('/userInfo', async (req, res) => {
    const userEmail = req.body.email; // Assuming the key is 'email' in the request body
    try {
        const userInfo = await User.findOne({ email: userEmail });
        if (!userInfo) {
            console.log('User information not found');
            return res.status(404).json({ message: 'User information not found' });
        }
        // Send the user's information in the response
        return res.status(200).json({ userInfo });
    } catch (error) {
        console.error('Error fetching user information:', error);
        return res.status(500).json({ message: 'Error fetching user information' });
    }
});


app.post('/editQuiz', async (req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');
        
        // Extract quiz data from the request body
        const { quizName, questionsData, quizCode } = req.body;

        // Parse the questions data
        const parsedQuestions = JSON.parse(questionsData);

        // Update the quiz in the database
        const result = await collection.updateOne(
            { quizCode: quizCode }, // Use the provided quizCode to match the quiz
            {
                $set: {
                    quizName,
                    questions: parsedQuestions
                }
            }
        );

        res.redirect('/teacherprofile.html');
        
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error });
    }
});


app.post('/fetchAssignedQuizzes', async (req, res) => {
    const { userEmail } = req.body;
    try {
        // Find all groups where the user is a member
        const groups = await Group.find({ members: userEmail });

        if (groups.length === 0) {
            return res.status(404).json({ message: 'No groups found for the student.' });
        }

        // Aggregate all quiz codes from all groups into a single array
        const quizzes = [];
        groups.forEach(group => {
            quizzes.push(...group.quizzes.map(quizCode => ({ quizCode })));
        });

        res.json({ quizzes });
    } catch (error) {
        console.error('Error fetching assigned quizzes:', error);
        res.status(500).json({ message: 'Error fetching assigned quizzes. Please try again.' });
    }
});


app.post('/deleteQuiz', async (req, res) => {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(db2Name);
        const collection = db.collection('quizzes');
        const groupCollection = db.collection('groups'); // Get the groups collection

        const { quizCode } = req.body;

        // Delete the quiz from the database
        const result = await collection.deleteOne({ quizCode });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Remove the quiz ID from the groups database
        await groupCollection.updateMany(
            { quizzes: quizCode }, // Update documents where the quizzes array contains the quizCode
            { $pull: { quizzes: quizCode } } // Pull (remove) the quizCode from the quizzes array
        );

        res.status(200).json({ message: 'Quiz deleted successfully' });

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error });
    }
});


//ADMIN ROUTES

// Fetch all users
app.get('/fetchallusers', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users. Please try again.' });
    }
});

// Delete User
app.delete('/deleteUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user. Please try again.' });
    }
});

// Edit User
app.put('/editUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { firstname, lastname, email, password, role } = req.body;
        await User.findByIdAndUpdate(userId, { firstname, lastname, email, password, role });
        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Error updating user details. Please try again.' });
    }
});

// Fetch all groups
app.get('/fetchallgroups', async (req, res) => {
    try {
        const groups = await Group.find({});
        res.status(200).json({ groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Error fetching groups. Please try again.' });
    }
});

// Delete Group
app.delete('/admindeleteGroup/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        await Group.findByIdAndDelete(groupId);
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Error deleting group. Please try again.' });
    }
});

// Edit Group
app.put('/editGroup/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { groupName, teacherEmail, members, quizzes } = req.body;
        await Group.findByIdAndUpdate(groupId, { groupName, teacherEmail, members, quizzes });
        res.status(200).json({ message: 'Group details updated successfully' });
    } catch (error) {
        console.error('Error updating group details:', error);
        res.status(500).json({ message: 'Error updating group details. Please try again.' });
    }
});

// Fetch all quizzes
app.get('/fetchallquizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find({});
        res.status(200).json({ quizzes });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Error fetching quizzes. Please try again.' });
    }
});

// Delete Quiz
app.delete('/deleteQuiz/:quizId', async (req, res) => {
    try {
        const quizId = req.params.quizId;
        await Quiz.findByIdAndDelete(quizId);
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ message: 'Error deleting quiz. Please try again.' });
    }
});

// Edit Quiz
app.put('/editQuiz/:quizId', async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const { quizName, questions } = req.body;
        await Quiz.findByIdAndUpdate(quizId, { quizName, questions });
        res.status(200).json({ message: 'Quiz details updated successfully' });
    } catch (error) {
        console.error('Error updating quiz details:', error);
        res.status(500).json({ message: 'Error updating quiz details. Please try again.' });
    }
});




console.log("Listening on PORT 3000");
