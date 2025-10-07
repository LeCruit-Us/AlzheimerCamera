DevPost: https://devpost.com/software/remember-me-e6pyuv

# Remember Me
Remember Me gives ones family a calm and affordable way to help loved ones when their memory falters. By pairing a friendly camera with a mobile app, we turn everyday moments into reassuring reminders so families can stay connected, even when names are hard to recall.

Contributors: Roy Zheng, Thomas Ah Sing, Aaron Rhim, Elijah Zhao

# About the project
### 🧠Inspiration
One of our team members experienced this challenge firsthand: their grandfather had a severe case of Alzheimer’s, but due to limited resources and the lack of accessible technology at the time, they were unable to preserve and enrich his life with cherished memories. Our team was deeply motivated by his story which led to our passion to create impactful technology for health and societal well-being. With the rise of high-end gadgets like the Meta Ray-Bans, we began exploring how similar innovations could be made more accessible and tailored to truly support people in need.

### 📖What it does
- Easily attach the camera to your clothes and whenever you pass by someone you've previously met, it will announce the name of that person, their relationship with you, and a short note
- You can add these "people profiles" easily onto the app (currently works on iPhone) by taking a quick picture of the person and filling in general information (this would usually be done by a family member)
- You can also "revisit" the people profiles in an easy-to-use "memories" page. Here you can also add a photo album for each of the people in your memories
- There is a reminders page so that you can get alerts when you need to do someething (e.g. take medication, attend this event, etc.)

### 💪How we built it
We started off with connecting a NexiGo N60 1080p Webcam to our laptop so that we can stream video and audio in real time. In python, we used OpenCV to send post requests from the camera to our Flask backend. 

Traditional and expensive methods for live streaming and live AI facial recognition limit accessibility, making it difficult for everyday users to adopt these solutions. Our methodology involves a simple backend service that receives the frames and then relies on Amazon Rekognition to apply a quick facial recognition AI scan which is then saved as a state in AWS S3. Then, we in the case where we need to extract information from the identified user, we retrieve their profile from DynamoDB. We then use ElevenLabs to voice the message so the announcement sounds human. 

Additionally, we save the photos and memory albums live in Amazon S3 and DynamoDB, while the frontend is built with React Native, Expo Router, and React Native's AsyncStorage to store and retrieve profiles and keep reminders available offline. 

### ‼️Challenges we ran into
We initially had the cool idea to use an ESP32-CAM module and explore the intricacies of hardware but our Amazon delivery guy couldn't find the drop-off location and we were left with nothing. Half of our members spent 3 hours trying to find ways to pick up the module but because we were not from Simon Fraser University, it was very hard to navigate around. Luckily, one of our team members happened to have a spare camera so we used that instead. 

### 🌟Accomplishments that we're proud of
We are very proud of our resourcefulness when we lost our most important piece to the project. At the border of completely changing the project idea, we were able to just modify it slightly to compensate for the lack of technical hardware with the portable webcam. We are also proud of building such a large and feature-packed application within 24 hours!

### 💯What we learned
Throughout this project we learned how to quickly adapt when hardware plans fall through, and how to creatively re-scope an idea without losing its heart. We deepened our knowledge of integrating multiple AWS services (Rekognition, DynamoDB, and S3) with a lightweight Flask backend, while also learning to manage the tradeoffs between speed, cost, and accessibility when building real-time systems. On the frontend, we grew comfortable with React Native and Expo Router for rapid prototyping, and discovered the importance of designing a calm, intuitive experience for users who may already feel overwhelmed. Most importantly, we learned how impactful technology can be when it’s guided by empathy and real-world needs.

### 🚀What's next for Remember Me
We’re exploring on-device fallbacks so the camera can keep working during patchy internet, richer emotion cues that adapt the reminder tone based on context, and secure sharing so distant relatives can add memories without digging into AWS consoles. Longer term, we want to integrate medication adherence data and mood tracking so caregivers get a fuller picture of how their loved one is doing day to day.

####Built with

    Flask + Python
    OpenCV
    Amazon Rekognition
    Amazon DynamoDB
    Amazon S3 Bucket
    ElevenLabs TTS
    React Native + Expo
    AsyncStorage
