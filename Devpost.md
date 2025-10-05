AlzheimerCamera gives caregivers a calm co-pilot when memory falters. By pairing a friendly camera with a mobile app, we turn everyday moments into reassuring reminders so families can stay connected, even when names are hard to recall.

About the project

Inspiration

Three out of five family caregivers we spoke with said the hardest moments are when a loved one no longer recognises the faces they see every day. They spend hours labelling photo albums, coaching greetings, and repeating stories in the hope that something sticks. AlzheimerCamera grew out of those conversations. We wanted a lightweight way to reassure someone, in the moment, that the person standing in front of them is safe, loved, and familiar—while also giving caregivers better tools to organise reminders and memories without juggling multiple apps.

What it does

    Set up the camera in the living room or at the front door; when a familiar face appears, the system gently announces who it is, their relationship, and a comforting note.
    Caregivers capture and curate “people profiles” with photos, context, and personal anecdotes that become the voice prompts the camera uses.
    A companion Expo mobile app keeps track of daily reminders, medication prompts, and shared memory albums so families can revisit highlights together.
    Alerts trigger a soft vibration and haptic feedback on the phone, while optional audio clips give the person with Alzheimer’s an easy cue to recognise their visitor.

How we built it

We kicked things off by plugging a NexiGo N60 1080p webcam into our laptops and stress-testing how much real-time video and audio we could push before the USB hub begged for mercy. Once we confirmed it could handle teammates waving, toddlers sneaking into frame, and the office ficus, we graduated the setup to a Raspberry Pi so the camera could live where the action happens.

From there it was a joyful wiring party. A lightweight Python uploader fires those frames at our Flask backend, which high-fives Amazon Rekognition to see if anyone in view matches the loved ones we’ve saved. When it finds a hit, DynamoDB hands back the profile details, Amazon Bedrock turns the caregiver’s notes into a friendly script, and ElevenLabs gives it a warm voice. Meanwhile, every photo and memory album heads to Amazon S3, and the Expo/React Native app keeps caregivers in the loop with reminders cached locally in AsyncStorage for offline moments. The whole loop feels like a relay race—camera spots the face, backend grabs the right story, and within seconds a familiar voice says exactly what the room needs to hear.

Challenges

Building trust was the biggest hurdle. We had to make sure low-light or off-angle photos still matched correctly without producing awkward misidentifications, so we cycled through camera tuning, OpenCV preprocessing, and plenty of real-world testing. Latency was another pressure point—caregivers lose faith if the reminder arrives several seconds late—so we streamlined our API calls and trimmed image payloads. Finally, translating technical outputs into calm, non-technical language pushed us to iterate on Bedrock prompts and mobile copy until every message felt like it came from a family member, not a robot.

What’s next for AlzheimerCamera?

We’re exploring on-device fallbacks so the camera can keep working during patchy internet, richer emotion cues that adapt the reminder tone based on context, and secure sharing so distant relatives can add memories without digging into AWS consoles. Longer term, we want to integrate medication adherence data and mood tracking so caregivers get a fuller picture of how their loved one is doing day to day.

Built with

    Flask + Python
    OpenCV
    Amazon Rekognition
    Amazon DynamoDB
    Amazon S3
    Amazon Bedrock (Titan)
    ElevenLabs
    React Native + Expo
    AsyncStorage
    Raspberry Pi hardware
