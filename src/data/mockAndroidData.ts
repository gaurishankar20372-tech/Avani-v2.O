import { Contact, InstalledApp } from "../types";

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Alex Rivera",
    phone: "+1 (555) 234-5678",
    email: "alex.rivera@example.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    relationship: "Best Friend",
  },
  {
    id: "c2",
    name: "Sarah Chen",
    phone: "+1 (555) 876-5432",
    email: "sarah.chen@techcorp.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    relationship: "Work Colleague",
  },
  {
    id: "c3",
    name: "Mom",
    phone: "+1 (555) 999-1234",
    email: "mom.family@gmail.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    relationship: "Family",
  },
  {
    id: "c4",
    name: "Marcus Vance",
    phone: "+1 (555) 432-1098",
    email: "marcus.vance@studio.design",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    relationship: "Project Lead",
  },
  {
    id: "c5",
    name: "Emma Watson",
    phone: "+1 (555) 345-6789",
    email: "emma.w@creative.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
    relationship: "Friend",
  },
];

export const INSTALLED_APPS: InstalledApp[] = [
  {
    packageName: "com.google.android.youtube",
    name: "YouTube",
    iconName: "Youtube",
    category: "Media",
    launchUrl: "https://www.youtube.com",
    deepLinkScheme: "vnd.youtube:",
  },
  {
    packageName: "com.instagram.android",
    name: "Instagram",
    iconName: "Instagram",
    category: "Social",
    launchUrl: "https://www.instagram.com",
    deepLinkScheme: "instagram://",
  },
  {
    packageName: "com.whatsapp",
    name: "WhatsApp",
    iconName: "MessageCircle",
    category: "Social",
    launchUrl: "https://web.whatsapp.com",
    deepLinkScheme: "whatsapp://",
  },
  {
    packageName: "com.spotify.music",
    name: "Spotify",
    iconName: "Music",
    category: "Media",
    launchUrl: "https://open.spotify.com",
    deepLinkScheme: "spotify://",
  },
  {
    packageName: "com.google.android.gm",
    name: "Gmail",
    iconName: "Mail",
    category: "Productivity",
    launchUrl: "https://mail.google.com",
    deepLinkScheme: "mailto:",
  },
  {
    packageName: "com.google.android.apps.maps",
    name: "Google Maps",
    iconName: "MapPin",
    category: "Utilities",
    launchUrl: "https://maps.google.com",
    deepLinkScheme: "geo:0,0?q=",
  },
  {
    packageName: "com.android.calculator2",
    name: "Calculator",
    iconName: "Calculator",
    category: "Utilities",
    launchUrl: "",
    deepLinkScheme: "calc://",
  },
  {
    packageName: "com.android.camera",
    name: "Camera",
    iconName: "Camera",
    category: "System",
    launchUrl: "",
    deepLinkScheme: "camera://",
  },
  {
    packageName: "com.android.settings",
    name: "Settings",
    iconName: "Settings",
    category: "System",
    launchUrl: "",
    deepLinkScheme: "settings://",
  },
];

export const SASSY_REMARKS = {
  greetings: [
    "I'm awake! What marvelous chaos are we tackling today?",
    "Avani here! Try to keep up, okay?",
    "Look who decided they need my genius today. What's on your mind?",
    "Reporting for duty! Lay it on me, boss.",
    "Your favorite AI is online. Don't worry, I won't judge your playlist choices... much.",
  ],
  greetingsHindi: [
    "नमस्ते! अवनी हाज़िर है। बताइए आज क्या नया तूफान मचाना है?",
    "अरे वाह! आखिरकार मेरी याद आ ही गई? बोलिए क्या हुक्म है सरकार?",
    "अवनी ऑनलाइन है! ज़रा तेज़ी से बोलिएगा, मेरा वक्त बहुत कीमती है।",
    "लो जी, मैं आ गई! आपके सारे काम चुटकियों में निपटाने के लिए तैयार।",
  ],
  openApp: [
    "Firing up {app}! Please try not to get lost in the endless scrolling loop.",
    "Opening {app} for you. Look at you being all productive (or not)!",
    "Launching {app}... You're welcome!",
  ],
  openAppHindi: [
    "लो जी, {app} खोल दिया है। अब घंटों रील्स में मत खो जाना!",
    "{app} शुरू हो रहा है। शुक्र है आज कुछ नया काम कर रहे हैं!",
  ],
  instagramDirect: [
    "Opening Instagram Direct for @{username} with your message! Remember, Meta sandbox requires your final tap to send, but I've done all the heavy lifting.",
    "Direct message prepared for @{username} on Instagram! Off you go, don't leave them on read!",
    "Sliding into @{username}'s DMs for you! Ready for your review and send.",
  ],
  instagramDirectHindi: [
    "इंस्टाग्राम डायरेक्ट पर @{username} के लिए मैसेज तैयार कर दिया है! बस एक टैप में भेज दीजिए।",
    "लीजिए, @{username} की इंस्टाग्राम चैट खोल दी है। अब ज़रा तमीज़ से बात कीजिएगा!",
    "इंस्टाग्राम डायरेक्ट मैसेज रेडी है! प्राइवेसी की वजह से बस आपका एक टैप बाकी है।",
  ],
  callContact: [
    "Calling {name} now! Hope you actually have something important to say.",
    "Dialing {name}. Putting on my best wingwoman hat for you.",
    "Connecting you to {name}. Be nice!",
  ],
  callContactHindi: [
    "{name} को कॉल लगा रही हूँ। उम्मीद है कोई ज़रूरी बात ही होगी!",
    "लीजिए, {name} का नंबर मिला दिया। अब ज़रा सलीके से बात कीजिएगा!",
  ],
  whatsApp: [
    "Drafting that WhatsApp to {name}. Look at you communicating with human beings!",
    "Sending message to {name}. I made sure it doesn't sound too awkward.",
    "WhatsApp fired up for {name}. Ready when you are.",
  ],
  whatsAppHindi: [
    "{name} के लिए वॉट्सऐप मैसेज ड्राफ्ट कर दिया है। देख लीजिए कुछ गड़बड़ तो नहीं लिखी!",
    "वॉट्सऐप पर मैसेज तैयार है। अब बस सेंड दबाने की देरी है!",
  ],
  email: [
    "Drafting your email to {recipient}. Adding 10% more corporate elegance for you.",
    "Email queued up! Sending out emails like a true professional.",
  ],
  emailHindi: [
    "{recipient} के लिए ईमेल का ड्राफ्ट खोल दिया है। एकदम प्रोफेशनल लग रहा है!",
  ],
  permissionDenied: [
    "Nice try, but you forgot to give me the {permission} permission! Turn it on if you want me to do your bidding.",
    "I'd love to, but my hands are tied because {permission} is turned off. Toggle it in settings, will ya?",
    "Error 403: Avani lacks the {permission} permission. Give me access and we'll talk!",
  ],
  permissionDeniedHindi: [
    "अरे जनाब! पहले {permission} की परमिशन तो दीजिए। बिना परमिशन के मैं कैसे काम करूँ?",
    "माफ़ कीजिएगा, आपने {permission} बंद कर रखी है। पहले सेटिंग्स में जाकर ऑन कीजिए!",
  ],
  interrupted: [
    "Whoops, you're talking! I'll zip it.",
    "Cutting off! I'm listening.",
    "Alright, go ahead, I'm all ears.",
  ],
  createAndDeliverFileHindi: [
    "लो जी सरकार! आपके लिए पूरा कोड और डॉक्युमेंट तैयार कर दिया है। स्क्रीन पर देख लीजिए और PDF या ZIP में तुरंत डाउनलोड कर लीजिए!",
    "हुक्म की तामील हुई! कोड एकदम फर्स्ट क्लास लिख दिया है। जब चाहें PDF या ZIP फ़ाइल में सेव करें या वॉट्सऐप पर भेजें।",
    "लीजिए, क्लीन और टेस्टेड कोड हाज़िर है! PDF या ZIP दोनों ऑप्शन रेडी हैं, अब मत कहना कि अवनी काम नहीं करती!",
  ],
  createAndDeliverFile: [
    "Boom! Code written and delivered right to your screen. You can grab it as a PDF, ZIP, or share it immediately!",
    "Here is your code and document, clean, tested and ready to roll! Download as PDF, ZIP, or send via WhatsApp/Email.",
    "Done! Written with my signature flair. Check the screen to export as PDF or ZIP!",
  ],
  stopSpeechHindi: [
    "अच्छा ठीक है, रुक गई!",
    "लीजिए, मैं शांत हो गई। बोलिए क्या कहना चाहते हैं?",
    "हुक्म सर आँखों पर! मैं चुप हो गई।",
  ],
  stopSpeech: [
    "Stopping right now!",
    "Zipped my lips! What's on your mind?",
    "Quiet as a whisper. Go ahead!",
  ],
  resumedSpeechHindi: [
    "आसपास के शोर को छोड़कर... हाँ, तो मैं कह रही थी...",
    "लगता है सिर्फ़ बैकग्राउंड का शोर था। मैं अपनी बात पूरी करती हूँ...",
  ],
  resumedSpeech: [
    "Filtering out the ambient noise... as I was saying...",
    "Just background chatter. Continuing my answer...",
  ],
};
