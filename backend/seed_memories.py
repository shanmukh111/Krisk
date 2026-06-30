#!/usr/bin/env python3
"""
seed_memories.py - Populate Cognee with ~100 realistic, 50+ word memories for
ONE coherent persona, with deliberate redundancy + evolving/contradictory
threads so memify/improve has real structure to consolidate later.

Run from backend/ with venv active:
    python seed_memories.py

Saves in batches with pauses so the fire-and-forget cognify() queue drains
instead of piling up. Budget 20-40 min of background processing.
"""

import time
from utils.cognee_memory import save_conversation, get_past_preferences

# (transcript_text, item, category) — each transcript is 50+ words.
# Persona: 26 y/o software dev in Hyderabad named in-context as "the user".
# Threads: biryani obsession (redundant), movie taste evolving action->thriller,
# a spicy-food contradiction, recurring gym/running, music shift, travel, gadgets.
MEMORIES = [
    # --- FOOD: biryani thread (heavy redundancy on purpose) ---
    ("Honestly I could eat Hyderabadi chicken biryani every single day of the week. The dum style with the long basmati rice and that smoky flavour is unbeatable for me. I usually order it from Paradise or Bawarchi whenever I am too lazy to cook on weekends.", "chicken biryani", "food"),
    ("I was craving biryani again today so I ordered a large mutton biryani for lunch. The mutton was so tender it fell off the bone, and the raita on the side balanced the spice perfectly. Biryani is genuinely my comfort food whenever I am stressed about work deadlines.", "mutton biryani", "food"),
    ("My friends keep teasing me because every time we plan to eat out I suggest biryani. I cannot help it, a good hyderabadi dum biryani with boiled egg and salan on the side is my idea of a perfect meal. I think I have tried almost every biryani place in the city by now.", "biryani", "food"),
    ("Tried a new Lucknowi style biryani today which is much milder and more aromatic than the spicy Hyderabadi one I am used to. It was good but honestly I still prefer the fiery Hyderabadi version with extra mirchi ka salan. Biryani regional styles are fascinating to compare.", "lucknowi biryani", "food"),
    ("Made biryani at home for the first time this weekend using a YouTube recipe and it actually turned out decent. Layering the rice and marinated chicken and getting the dum right takes patience but it was worth it. Cooking biryani myself made me appreciate the restaurant ones even more.", "homemade biryani", "food"),
    ("Weekend ritual is ordering biryani and watching something. Today it was a chicken biryani family pack shared with my roommate. We always argue over who gets the extra leg piece. Biryani plus a good movie is basically my definition of unwinding after a long week of coding.", "chicken biryani", "food"),

    # --- FOOD: other items + the spicy contradiction ---
    ("I genuinely cannot handle very spicy food, my tolerance is pretty low and anything too hot ruins the meal for me. I always ask restaurants to keep the spice mild because otherwise I am just drinking water the whole time instead of enjoying what I ordered.", "mild food", "food"),
    ("Ordered the extra spicy chicken 65 today and added extra green chillies on top because I was in the mood for something really fiery. The spicier the better honestly, I love that burning kick that makes your eyes water a little. Spicy food just hits different when you are craving it.", "spicy chicken 65", "food"),
    ("Had a craving for pizza tonight so I ordered a large farmhouse with extra cheese and jalapenos. Pizza is my go to when I do not feel like biryani, which is rare but happens. The thin crust ones are my favourite, loaded with veggies and a lot of mozzarella.", "pizza", "food"),
    ("Masala dosa for breakfast at the local Udupi place never disappoints. Crispy golden dosa with the spicy potato filling and two types of chutney plus sambar. It is cheap, filling and reminds me of my college mornings. South Indian breakfast is severely underrated honestly.", "masala dosa", "food"),
    ("Tried making pasta at home with a white sauce and lots of garlic and herbs. It came out creamy and rich, though I think I added too much cheese. Italian food is a nice change when I want something different from the usual Indian spread I eat all week.", "pasta", "food"),
    ("Went out for haleem during Ramzan season and it was incredible, so rich and slow cooked with that meaty texture. Hyderabad really does haleem like nowhere else. I look forward to this every year, it is one of those seasonal foods you cannot get any other time.", "haleem", "food"),
    ("Sunday brunch was a big plate of idli vada with extra sambar and coconut chutney. Light, fluffy and comforting. I love that South Indian breakfast is mostly steamed and healthy compared to the heavy fried stuff. Filter coffee on the side completed the whole experience.", "idli vada", "food"),
    ("Got some street style pani puri in the evening and ate way too many plates. The tangy spicy water is addictive and I always tell the vendor to make it extra teekha. Chaat is my weakness when I am walking around in the evening with friends.", "pani puri", "food"),
    ("Ordered butter chicken with garlic naan for dinner because I wanted something creamy and indulgent. The gravy was rich and buttery, perfect for scooping up with the soft naan. North Indian restaurant food is my treat meal when I want to feel a little fancy.", "butter chicken", "food"),

    # --- ENTERTAINMENT: action -> thriller evolution ---
    ("I am a huge fan of action movies, give me explosions and car chases and a hero taking down a hundred goons any day. The recent action blockbusters with big stunt sequences are exactly my kind of weekend entertainment. I rewatch the John Wick films constantly.", "action movies", "entertainment"),
    ("Watched another high octane action film tonight, loved every minute of the fight choreography and the relentless pace. Action cinema where the stakes keep rising and the protagonist barely survives is so satisfying. I rate a movie mostly on how good its action set pieces are.", "action movies", "entertainment"),
    ("Lately I have been getting more into psychological thrillers rather than pure action. The slow burn tension and the twist endings keep me thinking long after the credits roll. There is something more rewarding about a film that messes with your head than just mindless explosions.", "psychological thriller", "entertainment"),
    ("Just finished a gripping crime thriller series and I could not stop watching, binged the whole thing in two nights. The way they planted clues and built suspense was masterful. I think my taste is shifting from loud action towards smart suspenseful storytelling these days.", "crime thriller", "entertainment"),
    ("Recommended a mystery thriller to my friends because I have been on a huge thriller kick recently. I used to only watch action but now a well written suspense plot with an unreliable narrator excites me way more. Funny how taste evolves over a couple of years.", "mystery thriller", "entertainment"),
    ("Watched a comedy tonight to lighten the mood after a stressful week, sometimes you just need to laugh without thinking too hard. A good situational comedy with witty dialogue is underrated. Not everything has to be intense thrillers and action, balance is nice once in a while.", "comedy", "entertainment"),
    ("Documentaries about technology and startups have become a recent obsession. I watched one about the rise and fall of a famous company and it was more thrilling than any fiction. Real stories of ambition and failure in the tech world really resonate with me as a developer.", "tech documentary", "entertainment"),

    # --- MUSIC ---
    ("My playlists are mostly lofi hip hop these days because it helps me focus while coding for hours. The chill mellow beats fade into the background and keep me in flow without lyrics distracting me. I have a few favourite lofi channels I leave running all day at work.", "lofi", "music"),
    ("I really enjoy Punjabi music when I am working out or driving, the energy and the beat just pump me up. Something about those tracks makes a boring commute or a tough gym session way more bearable. I keep a hype playlist full of them for exactly those moments.", "punjabi music", "music"),
    ("Lately I have been exploring more indie and soft acoustic music in the evenings to wind down. The stripped back guitar and honest lyrics are a nice contrast to the high energy stuff I play during the day. My music taste really depends on my mood and the time.", "indie acoustic", "music"),
    ("Made a dedicated workout playlist full of fast paced tracks with heavy bass because I cannot run without good music. The right song genuinely makes me push for an extra kilometre. Music and exercise are completely linked for me, a dead phone battery ruins my whole run.", "workout playlist", "music"),
    ("Went down a nostalgia rabbit hole and listened to old Bollywood hits from the nineties all evening. Those melodies remind me of long car trips as a kid with my family. Sometimes the old classics beat anything new, there is a warmth to them you cannot replicate.", "old bollywood", "music"),

    # --- FITNESS / running (recurring) ---
    ("Started running again this week, did three kilometres this morning and it felt great even though my legs are sore now. I want to build up to a proper ten kilometre run over the next couple of months. Morning runs really set a positive tone for my whole day.", "running", "fitness"),
    ("Hit the gym for a leg day session and absolutely destroyed myself on squats and lunges. Walking down stairs is going to be a nightmare tomorrow but the soreness feels earned. I have been trying to stay consistent with strength training alongside my running routine lately.", "gym", "fitness"),
    ("Managed a five kilometre run today which is a new personal best for me, I was so happy when my app buzzed to tell me. Slowly increasing the distance every week is paying off. The discipline of regular running has spilled over into other areas of my life too.", "running", "fitness"),
    ("Bought a new pair of running shoes because my old ones were completely worn out and starting to hurt my knees. Good cushioning makes such a difference on long runs. I went for a lightweight pair with proper arch support after reading a bunch of reviews online.", "running shoes", "shopping"),
    ("Trying to fix my sleep schedule so I can wake up early for runs before work. Going to bed by eleven and getting up at six has been brutal but it is slowly becoming a habit. A consistent routine seems to be the secret to actually sticking with fitness.", "sleep schedule", "fitness"),

    # --- SHOPPING / gadgets ---
    ("I have been eyeing a new mechanical keyboard for my coding setup, something with tactile brown switches for that satisfying typing feel. My current keyboard is mushy and uninspiring. A good keyboard is a worthwhile investment when you type code for eight hours a day every day.", "mechanical keyboard", "shopping"),
    ("Finally bought a second monitor for my desk and my productivity has genuinely improved having all that extra screen space. I can keep documentation on one screen and code on the other. I cannot believe I waited so long, it is a small upgrade that changes everything.", "monitor", "shopping"),
    ("Looking for a good budget laptop for my younger cousin who is starting college soon. It needs to handle basic coding and browsing without breaking the bank. I have been comparing a few models online and reading specs late into the night to find the best value.", "laptop", "shopping"),
    ("Ordered a phone charger and a couple of charging cables because mine keep fraying at the connector. The cheap ones never last so this time I splurged on braided ones that should be more durable. Small annoying purchases but a dead phone is genuinely stressful.", "phone charger", "shopping"),
    ("Bought a pair of noise cancelling headphones and they have been a game changer for focus in a noisy apartment. Blocking out the street sounds while I code or take calls is worth every rupee. I should have invested in proper headphones years ago honestly.", "headphones", "shopping"),
    ("My wishlist has a standing desk on it because sitting all day is wrecking my back. I have read that alternating between sitting and standing is much healthier for long work hours. Saving up for a good motorised one rather than a cheap manual version.", "standing desk", "shopping"),

    # --- WORK / coding ---
    ("Spent the whole day debugging a nasty issue in our backend where a service kept dropping connections. Turned out to be a stale configuration pointing at the wrong host. So satisfying when you finally find the root cause after hours of staring at logs and scratching your head.", "debugging", "work"),
    ("Learning more about knowledge graphs and vector databases lately for a side project I am building. The way you can model relationships and do semantic search is genuinely fascinating. I have been reading documentation and experimenting with small prototypes after work most evenings this week.", "knowledge graphs", "work"),
    ("Our team had a long planning meeting today about the next sprint and the scope feels ambitious. I prefer writing code to sitting in meetings but alignment matters. I just want to get back to my editor and actually build the features we keep talking about.", "sprint planning", "work"),
    ("Refactored a big messy module today and it feels so good to see clean readable code where there was chaos before. Reducing complexity and adding proper tests gives me a weird sense of peace. Good code is like a tidy room, everything in its right place.", "refactoring", "work"),
    ("Trying to get better at writing tests before I write the actual feature code. Test driven development is hard to stick to but it catches so many bugs early. I am slowly building the discipline because future me always thanks past me for the test coverage.", "testing", "work"),

    # --- TRAVEL ---
    ("Planning a trip to Goa with friends next month and I am so excited for the beaches and the seafood. We want to rent bikes and explore the smaller quieter beaches away from the tourist crowds. A break from the city and the screen is exactly what I need.", "goa trip", "travel"),
    ("Visited a hill station last weekend and the cool weather and greenery were a perfect escape from the city heat. We did a small trek and the view from the top was absolutely worth the sore legs. Nature has a way of resetting your whole mental state.", "hill station", "travel"),
    ("I really want to do a solo trip sometime soon, just me and a backpack exploring a new city at my own pace. There is something appealing about not having to coordinate with anyone and following whatever catches my eye. Maybe Pondicherry or somewhere with a slow vibe.", "solo trip", "travel"),
    ("Booked train tickets to visit my parents next week and I am looking forward to home cooked food and a break from cooking for myself. The long train journey is oddly relaxing, watching the countryside go by with some music on. Going home always recharges me.", "visiting parents", "travel"),
    ("Dreaming about an international trip eventually, maybe somewhere in Southeast Asia with great street food and beaches. The food scene is a huge part of why I want to go there. Saving up slowly and reading travel blogs to plan the perfect first overseas adventure.", "international trip", "travel"),

    # --- CALENDAR / scheduling ---
    ("I have a dentist appointment coming up next week that I keep forgetting about, I really need to set a reminder. I have been putting off this checkup for months and my tooth has been a little sensitive. Adulting means actually scheduling these boring health things.", "dentist appointment", "calendar"),
    ("Need to block time this weekend to finish my side project because weekday evenings are too tiring after work. Setting aside a proper chunk of focused hours rather than scattered bits seems to work better for me. Protecting that time on my calendar is the only way it happens.", "side project time", "calendar"),
    ("Got a friend's birthday dinner to plan for next Friday and I want to surprise them with a reservation at that new place. Coordinating everyone's schedules is always the hardest part. I should send out the invite soon before everyone's weekend fills up with other plans.", "birthday dinner", "calendar"),
    ("Have a team offsite scheduled at the end of the month and I am actually looking forward to it. A change of environment and some non work bonding with colleagues sounds refreshing. I just need to remember to book my travel and sort out the logistics in time.", "team offsite", "calendar"),
    ("My weekly routine has a standing call with my mentor every Tuesday evening which I genuinely value. The career advice and perspective they offer is worth more than any course. I always block that time and come prepared with specific questions about my growth.", "mentor call", "calendar"),

    # --- MISC lifestyle ---
    ("I have been trying to read more books instead of doom scrolling on my phone before bed. Currently working through a science fiction novel and it is so much more satisfying than mindless feeds. Building the habit is hard but my sleep and mood are noticeably better.", "reading", "lifestyle"),
    ("Started keeping a small journal where I jot down three things I am grateful for each night. It sounds cheesy but it genuinely shifts my mindset before sleep. On rough days it forces me to find something positive, which is exactly when I need it most.", "journaling", "lifestyle"),
    ("Trying to cut down on how much coffee I drink because I think it is messing with my sleep. Switching my afternoon cup to green tea has helped a little. I love coffee too much to quit entirely but moderation is probably the sensible adult choice here.", "coffee", "lifestyle"),
    ("Adopted a small routine of a ten minute morning meditation and it has helped my focus and anxiety quite a bit. Sitting quietly and just watching my breath felt impossible at first but it gets easier. Starting the day calm makes everything else feel more manageable.", "meditation", "lifestyle"),
    ("I have been decluttering my apartment slowly, getting rid of stuff I never use. A minimal clean space genuinely makes my mind feel clearer and I work better in it. Funny how physical clutter and mental clutter seem so closely connected for me.", "decluttering", "lifestyle"),
]

# Generate variations to reach ~100 by re-expressing some threads with new angles.
EXTRA = [
    ("Ordered chicken biryani yet again for dinner, the delivery guy probably recognises my address by now. There is just no beating that first spoonful of perfectly spiced rice with a piece of juicy chicken. Some people have a sweet tooth, I have a biryani tooth apparently.", "chicken biryani", "food"),
    ("Discovered a tiny hole in the wall place that does an incredible egg biryani for very cheap. The portion was huge and the flavour rivalled the fancy restaurants. I love finding these hidden gems where the food is unpretentious but absolutely delicious and easy on the wallet.", "egg biryani", "food"),
    ("Debated between biryani and a burger for lunch and obviously biryani won like it always does. My willpower around biryani is basically nonexistent. I keep telling myself I will eat something lighter and healthier but the moment I see it on the menu all that resolve vanishes.", "biryani", "food"),
    ("Another action movie night with the gang, we watched a big budget spectacle with insane stunts. Even though my taste is drifting towards thrillers, I will always have a soft spot for a well made action flick with a charismatic lead and practical effects over CGI.", "action movies", "entertainment"),
    ("The thriller I watched last night had a twist I genuinely did not see coming and I love that feeling. I have started predicting endings in action films too easily, but a clever thriller still manages to surprise me. That unpredictability is exactly what keeps me hooked now.", "thriller", "entertainment"),
    ("Did a long seven kilometre run this morning along the lake and it was meditative, just me and my music and the early light. Running has genuinely become the highlight of my mornings. I never thought I would be the kind of person who enjoys waking up early to exercise.", "running", "fitness"),
    ("Picked up a protein shake habit after workouts to help with recovery and muscle building. The chocolate flavour actually tastes decent which helps me stick with it. Pairing proper nutrition with my gym and running routine is something I should have started taking seriously much earlier.", "protein shake", "fitness"),
    ("My lofi focus playlist hit a thousand hours of listening this year according to my music app, which says a lot about how I spend my workdays. Those mellow beats are basically the soundtrack to every feature I have shipped. Productivity and lofi are inseparable for me now.", "lofi", "music"),
    ("Spent the evening comparing mechanical keyboard switches in detail, watching sound test videos to decide between tactile and linear. It is a surprisingly deep rabbit hole. I have basically become that person who has strong opinions about keyboard switches, which my non techie friends find hilarious.", "mechanical keyboard", "shopping"),
    ("Finalised the Goa trip itinerary with the group today, balancing beach time with a couple of good seafood spots I researched. Planning the food stops is honestly my favourite part of any trip. A holiday without trying the local cuisine feels like a wasted opportunity to me.", "goa trip", "travel"),
]

ALL_MEMORIES = MEMORIES + EXTRA
print(f"Total memories to seed: {len(ALL_MEMORIES)}")

BATCH = 10
DRAIN_WAIT = 60  # seconds to let each batch's cognify drain before next batch

for start in range(0, len(ALL_MEMORIES), BATCH):
    batch = ALL_MEMORIES[start:start + BATCH]
    print(f"\n--- Seeding batch {start//BATCH + 1} ({start+1}-{start+len(batch)}) ---")
    for txt, item, cat in batch:
        save_conversation(txt, [{"item": item, "category": cat}], "neutral", "general")
        print("  +", item, "|", txt[:50], "...")
        time.sleep(1)
    print(f"  ...waiting {DRAIN_WAIT}s for cognify to drain this batch...")
    time.sleep(DRAIN_WAIT)

print("\nAll batches submitted. Final long wait for remaining cognify...")
time.sleep(120)

print("\n=== Spot-check recall ===")
for probe in ["biryani", "thriller", "running", "keyboard", "goa"]:
    hits = get_past_preferences(probe)
    print(f"  '{probe}': {len(hits)} chunks returned")
print("\nDone. If recall returns hits, the memory layer is populated.")
