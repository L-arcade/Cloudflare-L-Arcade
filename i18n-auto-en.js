/* ============================================================
   Lakherance Arcade — automatische Englisch-Übersetzungsschicht
   Übersetzt bei state.lang === 'en' alle deutschen UI-Texte, die
   (noch) nicht über data-i18n / en ? ... : ... abgedeckt sind:
   Text im DOM (auch nachträglich gerenderter), Platzhalter/Titel,
   Canvas-Texte in Spielen sowie alert/confirm/prompt.
   Beim Wechsel zurück auf Deutsch wird alles wiederhergestellt.
   Neue Übersetzungen einfach unten in AUTO_EN_DICT ergänzen.
   Zahlen werden als {n} erkannt: "Runde {n}" -> "Round {n}".
   Elemente mit data-no-autotr werden nie übersetzt.
   ============================================================ */
(function () {
  const DICT = {
    "ARENA WÄHLEN": "CHOOSE ARENA",
    "SPIELEN • LERNEN • GESTALTEN": "PLAY • LEARN • CREATE",
    "läuft auf": "runs on",
    "jedem OS": "any OS",
    "alter>=18?": "age>=18?",
    "ja": "yes",
    "nein": "no",
    "volljährig": "adult",
    "minderjährig": "minor",
    "wiederholt Code": "repeats code",
    "\"rot\"": "\"red\"",
    "\"grün\"": "\"green\"",
    "\"blau\"": "\"blue\"",
    "neu": "new",
    "Sportwagen": "Sports car",
    "LKW": "Truck",
    "sichtbarer Inhalt": "visible content",
    "läuft synchron": "runs synchronously",
    "z.B. setTimeout": "e.g. setTimeout",
    "wartet": "waiting",
    "Event Loop: erst wenn": "Event loop: only when",
    "Call Stack leer ist": "the call stack is empty",
    "\"alter\"": "\"age\"",
    "\"stadt\"": "\"city\"",
    "geordnet, per Index": "ordered, by index",
    "Schlüssel → Wert": "key → value",
    "zahl = 5": "number = 5",
    "schnell, automatisch": "fast, automatic",
    "flexibel, manuell (new/delete)": "flexible, manual (new/delete)",
    "Mit Auswahl von Premium (monatlich, jährlich oder einmalig lebenslang) und Bestätigung der Zahlung über Google Play kommt ein Vertrag zustande.": "A contract is concluded when you select Premium (monthly, yearly or one-time lifetime) and confirm the payment via Google Play.",
    "Premium monatlich: 2,99 € pro Monat. Premium jährlich: 19,99 € pro Jahr. Premium lebenslang: einmalig 49,99 €, ohne Laufzeit und ohne Kündigung. Preise verstehen sich als Endpreise (Kleinunternehmer, keine Umsatzsteuer ausgewiesen).": "Premium monthly: €2.99 per month. Premium yearly: €19.99 per year. Premium lifetime: one-time €49.99, with no term and no cancellation. Prices are final prices (small business, no VAT charged).",
    "Abos verlängern sich automatisch und können jederzeit zum Ende der laufenden Abrechnungsperiode gekündigt werden — über die Kündigungsfunktion in der App unter \"Preise & Mitgliedschaft\" → \"Abo kündigen\" oder in Google Play unter \"Abos\". Der Lebenslang-Kauf ist kein Abo und muss nicht gekündigt werden.": "Subscriptions renew automatically and can be cancelled at any time, effective at the end of the current billing period — via the cancellation function in the app under \"Pricing & Membership\" → \"Cancel subscription\" or in Google Play under \"Subscriptions\". The lifetime purchase is not a subscription and does not need to be cancelled.",
    "Stand: September 2026": "As of: September 2026",
    "\"Nicht vergessen\" — Kassenbons, Garantien & Dokumente per KI merken": "\"Don't forget\" — remember receipts, warranties & documents with AI",
    "'for real for real' — wirklich wahr, ganz ehrlich": "'for real for real' — truly, honestly",
    "'genau mein Gefühl gerade', starke Identifikation": "'exactly how I feel right now', strong identification",
    "'if you know you know' — nur Insider verstehen es": "'if you know you know' — only insiders get it",
    "'point of view' — aus wessen Perspektive etwas erzählt wird": "'point of view' — from whose perspective something is told",
    "'you only live once' — man lebt nur einmal": "'you only live once'",
    ", (Komma)": ", (comma)",
    ". (Punkt)": ". (period)",
    "/ Monat": "/ month",
    "1. Geltungsbereich": "1. Scope",
    "1. Verantwortlicher": "1. Controller",
    "10 Level — Hindernissen ausweichen, die Strecke ins Ziel bringen": "10 levels — dodge obstacles and make it to the finish",
    "14 Tage": "14 days",
    "2. Vertragsschluss": "2. Conclusion of contract",
    "2. Welche Daten wir verarbeiten": "2. What data we process",
    "3. Preise & Laufzeit": "3. Prices & term",
    "3. Zahlungsabwicklung": "3. Payment processing",
    "30 Tage": "30 days",
    "4. Deine Rechte": "4. Your rights",
    "4. Kündigung": "4. Cancellation",
    "5. Haftung": "5. Liability",
    "5. Speicherdauer": "5. Storage period",
    "7 Tage": "7 days",
    ": (Doppelpunkt)": ": (colon)",
    "; (Semikolon)": "; (semicolon)",
    "Abzeichen": "Badges",
    "Adresse": "Address",
    "Aktiviert echte Handy-Benachrichtigungen (System-Popup) für die App — gilt geräteweit, gemeinsam mit den News-Benachrichtigungen. Danach kannst du unten sofort eine Test-Erinnerung mit dem nächsten Feiertag deiner Auswahl anzeigen lassen.": "Turns on real phone notifications (system pop-up) for the app — applies device-wide, together with the news notifications. Afterwards you can show a test reminder for the next holiday of your selection right below.",
    "Aktuell: Kostenlos": "Current: Free",
    "Alkohol, Drogen & Punkte": "Alcohol, drugs & points",
    "Alle Abos sind monatlich kündbar, ohne Mindestlaufzeit. Preise verstehen sich als Endpreise (Kleinunternehmer, keine Umsatzsteuer ausgewiesen).": "All subscriptions can be cancelled monthly, with no minimum term. Prices are final prices (small business, no VAT charged).",
    "Alle Paare gefunden! 🎉": "All pairs found! 🎉",
    "Alle Sprachen-Lernbereiche": "All language learning areas",
    "Alles aus Premium (Wissensbuch, Coding-Kurs, Sprachen)": "Everything in Premium (knowledge book, coding course, languages)",
    "Alleskönner": "All-rounder",
    "Allgemeine Geschäftsbedingungen (AGB)": "Terms and Conditions",
    "Alltagsrechner": "Everyday Calculators",
    "Anerkennung — du machst gerade alles richtig": "praise — you're doing everything right right now",
    "Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)": "Information pursuant to § 5 DDG (German Digital Services Act)",
    "Angst, etwas zu verpassen (fear of missing out)": "fear of missing out",
    "Anschreiben erstellen": "Write a cover letter",
    "Arabisch lernen": "Learn Arabic",
    "Arcade-Klassiker": "Arcade Classics",
    "Aufforderung, mal rauszugehen (zu viel Zeit online verbracht)": "a call to go outside (too much time spent online)",
    "Ausdruck von Lachen oder Aufregung, nachahmt Tastatur-Geräusch": "expression of laughter or excitement, imitating keyboard mashing",
    "Ausdruck von Sprachlosigkeit oder Überforderung": "expression of speechlessness or being overwhelmed",
    "Ausgaben": "Expenses",
    "Ausruf bei Beeindruckung oder Überraschung": "exclamation of being impressed or surprised",
    "Ausruf bei Enttäuschung, Erstaunen oder Genervtsein": "exclamation of disappointment, astonishment or annoyance",
    "Ausruf bei Erstaunen oder Ärger, nicht wörtlich gemeint": "exclamation of surprise or annoyance, not meant literally",
    "Ausruf des Unglaubens oder der Empörung": "exclamation of disbelief or outrage",
    "Aussprache-Trainer": "Pronunciation Trainer",
    "Ausübung:": "How to exercise it:",
    "Autobahn & Überholen": "Highway & overtaking",
    "Avatar & Rahmen": "Avatar & frame",
    "BWL: Betriebswirtschaftslehre": "Business Administration",
    "Bei digitalen Inhalten erlischt das Widerrufsrecht vorzeitig, wenn du der sofortigen Ausführung ausdrücklich zustimmst und bestätigst, dass du dadurch dein Widerrufsrecht verlierst.": "For digital content, the right of withdrawal expires early if you expressly agree to immediate performance and confirm that you thereby lose your right of withdrawal.",
    "Benny Biber: Dam Builders": "Benny Beaver: Dam Builders",
    "Beruf: Bewerbung & Office": "Career: applications & office",
    "Berühmte Formeln": "Famous formulas",
    "Berühmtheit, Aufmerksamkeit online": "fame, attention online",
    "Beweise für eine Behauptung (Screenshots, Nachrichten usw.)": "proof of a claim (screenshots, messages, etc.)",
    "Bild anhängen": "Attach image",
    "Billard (8-Ball)": "Billiards (8-Ball)",
    "Biologie": "Biology",
    "Bitte": "Please",
    "Block-Sturz": "Block Drop",
    "Brettspiele": "Board Games",
    "Bringe den Roboter zum Stern. Max. {n} Befehle.": "Get the robot to the star. Max. {n} commands.",
    "CSS-Quiz": "CSS Quiz",
    "Charisma und Geschick beim Flirten": "charisma and skill at flirting",
    "Chef, Anführer, der Boss der Gruppe": "boss, leader, the head of the group",
    "Chemie": "Chemistry",
    "Cloud-Synchronisierung": "Cloud sync",
    "Coding lernen (Roboter-Rätsel)": "Learn coding (robot puzzles)",
    "Coding-Kurs": "Coding Course",
    "Coding-Lernbuch": "Coding Handbook",
    "Computer-Grundlagen": "Computer Basics",
    "Computer-Wissen": "Computer Knowledge",
    "Dame": "Checkers",
    "Das Abo kann jederzeit zum Ende des laufenden Monats gekündigt werden — über die Kündigungsfunktion in der App unter \"Preise & Mitgliedschaft\" → \"Abo kündigen\".": "The subscription can be cancelled at any time, effective at the end of the current month — via the cancellation function in the app under \"Pricing & Membership\" → \"Cancel subscription\".",
    "Daten sichern": "Backup data",
    "Datenschutzerklärung": "Privacy Policy",
    "Dein Name (optional)": "Your name (optional)",
    "Denkspiele": "Brain Games",
    "Deutsche Grammatik A1–C2": "German Grammar A1–C2",
    "Deutschland": "Germany",
    "Die App verlangt kein Konto und keine Registrierung. Nutzungsdaten (Fortschritt, Level, Highscores, gewählter Plan) werden ausschließlich lokal auf deinem Gerät gespeichert und nicht an uns übertragen. Bei Abschluss eines Abos verarbeitet Google Play die dafür nötigen Zahlungsdaten (siehe Punkt 3).": "The app requires no account and no registration. Usage data (progress, levels, high scores, chosen plan) is stored only locally on your device and is not transmitted to us. When you take out a subscription, Google Play processes the payment data required for it (see section 3).",
    "Dies ist der Start des Lexikons — wir erweitern es Buchstabe für Buchstabe weiter, jedes Mal wenn wir gemeinsam daran arbeiten.": "This is the start of the glossary — we keep expanding it letter by letter every time we work on it together.",
    "Diese AGB gelten für die Nutzung der App Lakherance Arcade und aller kostenpflichtigen Zusatzfunktionen.": "These terms apply to the use of the Lakherance Arcade app and all paid additional features.",
    "Drei Tage": "Three days",
    "Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner Daten sowie Datenübertragbarkeit. Wende dich dazu an die oben genannte E-Mail-Adresse.": "You have the right to access, rectification, erasure and restriction of processing of your data, as well as data portability. To exercise these rights, contact the email address above.",
    "Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab Vertragsschluss.": "You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the conclusion of the contract.",
    "Dänische Krone": "Danish Krone",
    "Eine Woche": "One week",
    "Einen Monat": "One month",
    "Einfluss oder Ansehen, besonders online": "influence or reputation, especially online",
    "Einstellungen": "Settings",
    "Eltern-Bereich": "Parents Area",
    "Englische Grammatik": "English Grammar",
    "Englische Literatur": "English Literature",
    "Erkennen (Kamera)": "Recognize (camera)",
    "Ernährung & Gesundheit": "Nutrition & Health",
    "Erstelle Raum...": "Creating room...",
    "Erster Sieg": "First Win",
    "Eulenjagd": "Owl Hunt",
    "Fallbezogenes Fachgespräch": "Case-Based Oral Exam",
    "Feedback senden": "Send feedback",
    "Fehler": "Error",
    "Feiertag suchen…": "Search holiday…",
    "Finanzen": "Finance",
    "Firmenname / Dein Name": "Company name / your name",
    "Flugzeug fliegen": "How Planes Fly",
    "Flüsse/Berge": "Rivers/mountains",
    "Fortschritt pro Spiel": "Progress per game",
    "Fortschritts- und Nutzungsdaten liegen ausschließlich lokal auf deinem Gerät und werden gelöscht, sobald du die App deinstallierst oder deine Browserdaten löschst. Zahlungsdaten werden gemäß den gesetzlichen Aufbewahrungsfristen bei Google Play verarbeitet.": "Progress and usage data is stored only locally on your device and is deleted as soon as you uninstall the app or clear your browser data. Payment data is processed by Google Play in accordance with the statutory retention periods.",
    "Fotos zu PDF": "Photos to PDF",
    "Frage & Antwort": "Q&A",
    "Französisch Grundlagen": "French basics",
    "Freunde einladen": "Invite friends",
    "Ganzer Coding-Kurs, alle Sprachen": "Full coding course, all languages",
    "Gegen Lak": "Vs. Lak",
    "Gehaltsrechner": "Salary Calculator",
    "Gelöst mit {n} Befehlen.": "Solved with {n} commands.",
    "Gen-Z-Slang-Wörterbuch": "Gen Z Slang Dictionary",
    "Geografie & Weltwissen": "Geography & world knowledge",
    "Geografie: Länder & Sprachen": "Geography: countries & languages",
    "Geographie-Quiz": "Geography Quiz",
    "Geschichte-Quiz": "History Quiz",
    "Geschäftsprozesse": "Business Processes",
    "Gleichungslöser": "Equation solver",
    "Grammatikfehler": "Grammar mistakes",
    "Graphen-Rechner": "Graphing calculator",
    "Graphit": "Graphite",
    "Großmeister": "Grandmaster",
    "Handy-Benachrichtigungen aktivieren": "Enable phone notifications",
    "Hardware-Lexikon A–Z": "Hardware glossary A–Z",
    "Hauptstädte": "Capitals",
    "Hindi lernen": "Learn Hindi",
    "Hindi-Aussprache-Trainer": "Hindi Pronunciation Trainer",
    "Hindi-Fortschritt": "Hindi progress",
    "Hindi-Phrasenbuch": "Hindi Phrasebook",
    "Hindi-Recap-Quiz": "Hindi Recap Quiz",
    "Hindi-Satzbau-Trainer": "Hindi Sentence Builder",
    "Hindi-Schrift schreiben": "Write Hindi script",
    "Hindi-Wort des Tages": "Hindi word of the day",
    "Hindi-Wortschatz-Quiz": "Hindi Vocabulary Quiz",
    "Hindi-Wörterbuch": "Hindi dictionary",
    "Hindi-Zuordnungsspiel": "Hindi Matching Game",
    "Hinweis: Diese Adresse ist die private Anschrift und wird gemäß gesetzlicher Impressumspflicht öffentlich angezeigt.": "Note: This address is a private address and is displayed publicly due to the legal obligation to provide a legal notice.",
    "Hubschrauber": "Helicopter",
    "Hörverständnis-Übung 🔊 Hör zuerst die Aufnahme (Vorlesen-Button oben), bevor du liest!": "Listening comprehension 🔊 Listen to the recording first (read-aloud button above) before you read!",
    "Hühner-Flucht": "Chicken Escape",
    "Impressum": "Legal notice",
    "Inhalte werden nach bestem Wissen erstellt, eine Garantie für Fehlerfreiheit kann nicht übernommen werden.": "Content is created to the best of our knowledge; no guarantee can be given that it is free of errors.",
    "Installieren": "Install",
    "Internet-Ausdruck für Lachen, ähnlich 'haha'": "internet expression for laughing, similar to 'haha'",
    "Ja": "Yes",
    "Jahr": "Year",
    "Java & HTML-Quiz": "Java & HTML Quiz",
    "Jugendwort für einen auffällig-angeberischen jungen Mann, umstritten und oft abwertend genutzt": "youth slang for a flashy, show-off young man; controversial and often derogatory",
    "Kalender": "Calendar",
    "Kaufmännische Ausbildung": "Commercial training",
    "Kaufmännische Steuerung & Kontrolle": "Commercial Controlling",
    "Kein Zugriff auf Wissensbuch, Coding-Kurs & Sprachen": "No access to knowledge book, coding course & languages",
    "Keine": "None",
    "Keine Treffer gefunden.": "No matches found.",
    "Kirsche": "Cherry",
    "Klatsch oder Neuigkeiten erzählen": "sharing gossip or news",
    "Kleinunternehmer gemäß § 19 UStG — es wird keine Umsatzsteuer ausgewiesen. Eine Umsatzsteuer-Identifikationsnummer liegt nicht vor.": "Small business under § 19 UStG (German VAT Act) — no VAT is charged. There is no VAT identification number.",
    "Klicke Befehle, um dein Programm zu bauen…": "Tap commands to build your program…",
    "Kniffel": "Yahtzee",
    "Komplette Bewerbungsunterlagen": "Complete application documents",
    "Kontakt:": "Contact:",
    "Koralle": "Coral",
    "Kostenlos": "Free",
    "Krypto & Coding": "Crypto & Coding",
    "Kumpel, guter Freund": "buddy, good friend",
    "Kundenname / Firma": "Customer name / company",
    "Köln": "Cologne",
    "Königsblau": "Royal blue",
    "Lavendel": "Lavender",
    "Leicht": "Easy",
    "Lern-Tools": "Study Tools",
    "Leseverständnis-Übung": "Reading comprehension exercise",
    "Liste": "List",
    "Logikrätsel": "Logic puzzles",
    "Lokal auf einem Gerät gegeneinander würfeln": "Roll against each other locally on one device",
    "Lust auf etwas haben": "to be in the mood for something",
    "Länder": "Countries",
    "Länge": "Length",
    "Löschen": "Delete",
    "Mandarin lernen": "Learn Mandarin",
    "Mathe": "Math",
    "Mathe-Quiz": "Maths Quiz",
    "Mathe-Wissen: Trigonometrie & Vektoren": "Maths knowledge: trigonometry & vectors",
    "Matra-Lesetrainer": "Matra Reading Trainer",
    "Meine Bereiche": "My areas",
    "Meme-Begriff für einen unabhängigen, erfolgreichen Einzelgänger-Typ": "meme term for an independent, successful lone-wolf type",
    "Meme-Bezeichnung für einen selbstbewussten, dominanten Typ": "meme term for a confident, dominant guy",
    "Minze": "Mint",
    "Mit Auswahl eines kostenpflichtigen Tarifs (Basic oder Premium) und Bestätigung der Zahlung kommt ein Abo-Vertrag zustande.": "A subscription contract is concluded when you select a paid plan (Basic or Premium) and confirm the payment.",
    "Mit einem Raum-Code gegen andere spielen": "Play against others with a room code",
    "Mittel": "Medium",
    "Mitternacht": "Midnight",
    "Monatsmission": "Monthly Mission",
    "Musik lernen": "Learn music",
    "Muster mit Lücke": "Pattern with gap",
    "Mülltrennungs-Meister": "Recycling Master",
    "München": "Munich",
    "Nachsilbe für einen bestimmten ästhetischen Stil-Trend": "suffix for a particular aesthetic style trend",
    "Name eingeben:": "Enter name:",
    "Nein": "No",
    "Neu bei Kniffel? Anleitung & Geschichte": "New to Yahtzee? How to play & history",
    "Neu-Delhi": "New Delhi",
    "Neuigkeiten": "News",
    "Nicht vergessen": "Don't Forget",
    "Nichts Besonderes": "Nothing special",
    "Noch keine Spiele gespielt.": "No games played yet.",
    "Online spielen": "Play online",
    "Ozean": "Ocean",
    "PDF lesen": "Read PDF",
    "PDF-Werkzeuge": "PDF Tools",
    "Paare": "Pairs",
    "Papier (Hell)": "Paper (light)",
    "Pfirsich": "Peach",
    "Physik": "Physics",
    "Pieps Flug": "Peep Flight",
    "Profil": "Profile",
    "Projekt / Mitarbeiter (z. B. Max Mustermann)": "Project / employee (e.g. John Smith)",
    "Prozent/Brüche": "Percentages/fractions",
    "Punkte: {n} / {n}": "Points: {n} / {n}",
    "Python-Quiz": "Python Quiz",
    "Raum konnte nicht erstellt werden": "Room could not be created",
    "Reaktionstest": "Reaction test",
    "Rechenkünstler": "Maths whiz",
    "Rechnungen": "Invoices",
    "Rumänischer Leu": "Romanian Leu",
    "Runde {n}": "Round {n}",
    "Samurai-Schnitt": "Samurai Slash",
    "Schach": "Chess",
    "Schiebepuzzle": "Sliding Puzzle",
    "Schiffe versenken": "Battleship",
    "Schweiz": "Switzerland",
    "Schwer": "Hard",
    "Sekunden": "Seconds",
    "Senden": "Send",
    "Smaragd": "Emerald",
    "Software vs. Hardware": "Software vs. hardware",
    "Software-Lexikon A–Z": "Software glossary A–Z",
    "Solitär": "Solitaire",
    "Sonnenuntergang": "Sunset",
    "Spiele bleiben auf Kostenlos-Niveau (Level 1)": "Games stay at free level (level 1)",
    "Spiele bleiben auf Kostenlos-Niveau (Level {n})": "Games stay at free level (level {n})",
    "Spielen": "Play",
    "Spieler": "Player",
    "Spieler 1": "Player 1",
    "Spieler 2": "Player 2",
    "Spieler {n}": "Player {n}",
    "Spieler {n} ist am Zug": "Player {n}'s turn",
    "Spieler {n}: {n}": "Player {n}: {n}",
    "Stadt oder Land suchen…": "Search city or country…",
    "Stand: August 2026 — Platzhalter in eckigen Klammern [ ] bitte vor Veröffentlichung ausfüllen.": "As of: August 2026",
    "Stand: August {n} — Platzhalter in eckigen Klammern [ ] bitte vor Veröffentlichung ausfüllen.": "As of: August {n}",
    "Statistik": "Statistics",
    "Steuern verstehen": "Understanding taxes",
    "Stimmung, Atmosphäre": "mood, atmosphere",
    "Suchen — z.B. PDF, Umrechner, Mathe…": "Search — e.g. PDF, converter, maths…",
    "Suchen…": "Search…",
    "Symbole": "Symbols",
    "Südafrikanischer Rand": "South African Rand",
    "Südkoreanischer Won": "South Korean Won",
    "Taschenrechner": "Calculator",
    "Technik-Wissen: C#, SQL, Git & mehr": "Tech knowledge: C#, SQL, Git & more",
    "Technische Probleme": "Technical problems",
    "Teilen": "Share",
    "Teste dein Grammatikwissen auf Niveau A{n} mit {n} Fragen.": "Test your grammar knowledge at level A{n} with {n} questions.",
    "Teste dein Grammatikwissen auf Niveau B{n} mit {n} Fragen.": "Test your grammar knowledge at level B{n} with {n} questions.",
    "Teste dein Grammatikwissen auf Niveau C{n} mit {n} Fragen.": "Test your grammar knowledge at level C{n} with {n} questions.",
    "Text eingeben…": "Enter text…",
    "Thailändischer Baht": "Thai Baht",
    "Treffer": "Hits",
    "Türkis": "Turquoise",
    "Türkische Lira": "Turkish Lira",
    "Um dein Widerrufsrecht auszuüben, nutze die Widerrufsfunktion in der App unter \"Preise & Mitgliedschaft\" → \"Vertrag widerrufen\", oder informiere uns per E-Mail (info@lakherance.de) über deinen Entschluss.": "To exercise your right of withdrawal, use the withdrawal function in the app under \"Pricing & Membership\" → \"Withdraw from contract\", or inform us of your decision by email (info@lakherance.de).",
    "Umbenennen": "Rename",
    "Umrechner": "Converter",
    "Umsatzsteuer:": "VAT:",
    "Unerwartetes Ende": "Unexpected end",
    "Verantwortlich für die Datenverarbeitung ist die oben im Impressum genannte Person.": "The person named in the legal notice above is responsible for data processing.",
    "Vereinfacht: Eingabegeräte schicken Daten an den Prozessor (CPU), der mit dem Arbeitsspeicher (RAM) rechnet und Ergebnisse auf der Festplatte speichert oder auf dem Bildschirm zeigt.": "Simplified: input devices send data to the processor (CPU), which computes with the main memory (RAM) and saves results to the hard drive or shows them on the screen.",
    "Verhalten im Verkehr": "Traffic behavior",
    "Vier Gewinnt": "Connect Four",
    "Vorlesen": "Read aloud",
    "Vorlesen stoppen": "Stop reading aloud",
    "Vorzeitiges Erlöschen:": "Early expiry:",
    "Wald": "Forest",
    "Weiter ›": "Next ›",
    "Weiter →": "Next →",
    "Weltbevölkerung": "World population",
    "Weltraum & Quantenphysik": "Space & quantum physics",
    "Wer hat am Ende die höhere Gesamtpunktzahl?": "Who has the higher total score at the end?",
    "Werbefrei beim Spielen": "Ad-free while playing",
    "Werbefrei überall": "Ad-free everywhere",
    "Widerrufsbelehrung": "Right of withdrawal",
    "Widerrufsrecht:": "Right of withdrawal:",
    "Wie ein Computer aufgebaut ist": "How a computer is built",
    "Wie heißt du?": "What's your name?",
    "Willkommen": "Welcome",
    "Wirtschafts- & Sozialkunde": "Economics & Social Studies",
    "Wischen oder Pfeiltasten zum Spurwechsel": "Swipe or use arrow keys to change lanes",
    "Wissens-Quiz": "Knowledge Quiz",
    "Wissens-Quizze (Java/HTML/Python/CSS)": "Knowledge quizzes (Java/HTML/Python/CSS)",
    "Wochenmission": "Weekly Mission",
    "Woher das Spiel kommt, wie man es spielt, was die Kategorien bedeuten": "Where the game comes from, how to play it, what the categories mean",
    "Wort suchen (Deutsch oder Englisch)…": "Search word (German or English)…",
    "Wort suchen…": "Search word…",
    "Wortsuche": "Word Search",
    "Wörterbuch Deutsch ⇄ Englisch": "Dictionary German ⇄ English",
    "Würfeln": "Roll",
    "Zahlungen innerhalb der App werden über Google Play Billing abgewickelt (Google Ireland Limited). Es gelten die Google-Play-Nutzungsbedingungen und die Google-Datenschutzerklärung. Weitere Informationen: play.google.com/about/play-terms sowie policies.google.com/privacy": "In-app payments are processed via Google Play Billing (Google Ireland Limited). The Google Play Terms of Service and the Google Privacy Policy apply. More information: play.google.com/about/play-terms and policies.google.com/privacy",
    "Zeiterfassung": "Time tracking",
    "Zeitreisen": "Time Travel",
    "Ziel erreicht! 🎉": "Goal reached! 🎉",
    "Zu dritt": "Three players",
    "Zu viert": "Four players",
    "Zu zweit": "Two players",
    "Zusätzlich: alle Level in allen Spielen freigeschaltet": "Plus: all levels in all games unlocked",
    "Zwei Tage": "Two days",
    "Züge": "Moves",
    "Züge: {n}": "Moves: {n}",
    "Züge: {n} · Gefunden: {n}/{n}": "Moves: {n} · Found: {n}/{n}",
    "abwertende Bezeichnung für eine anspruchsvolle, nervige Person": "derogatory term for a demanding, annoying person",
    "albern, tollpatschig auf sympathische Art": "silly, clumsy in a likeable way",
    "angeben, mit etwas prahlen": "to show off, to brag about something",
    "aufregend, richtig gut, geil": "exciting, really good, awesome",
    "aus der Mode, nicht mehr angesagt": "out of fashion, no longer trendy",
    "bedeutungsloses Meme-Wort aus einer viralen Videoreihe, oft nur zum Spaß benutzt": "meaningless meme word from a viral video series, often used just for fun",
    "beste Freundin oder bester Freund": "best friend",
    "betont Nachdruck am Satzende, 'Punkt, aus, fertig'": "adds emphasis at the end of a sentence, 'period, end of story'",
    "bewusst versuchen, cool/beeindruckend zu wirken": "deliberately trying to look cool/impressive",
    "das Outfit, was man trägt": "the outfit you're wearing",
    "deine@email.de": "your@email.com",
    "der vorherrschende Geist/Trend einer Zeit": "the prevailing spirit/trend of an era",
    "die persönliche Ausstrahlung einer Person": "a person's personal aura/charisma",
    "ein Bier nach der Arbeit zum Entspannen": "a beer after work to unwind",
    "ein Sieg, Erfolg (von 'win')": "a victory, success (from 'win')",
    "ein Zungen-Haltungs-Trend aus dem Internet, angeblich für die Kieferform": "an internet tongue-posture trend, supposedly for jaw shape",
    "ein extrem großer Fan von jemandem sein": "being an extremely big fan of someone",
    "ein misstrauischer, skeptischer Seitenblick": "a suspicious, skeptical sideways glance",
    "ein plötzlicher Stimmungswechsel": "a sudden change of mood",
    "ein richtig guter Song": "a really good song",
    "ein ästhetisch stimmiger, bewusst gestalteter Stil": "an aesthetically consistent, deliberately designed style",
    "eine Aufgabe oder einen Look perfekt gemeistert haben": "to have perfectly nailed a task or a look",
    "eine Lüge, etwas Unwahres": "a lie, something untrue",
    "eine Niederlage, Pech gehabt": "a loss, bad luck",
    "eine erfolgreiche, selbstbewusste Frau (manchmal ironisch gemeint)": "a successful, confident woman (sometimes ironic)",
    "eine informelle Überprüfung der Stimmung oder des Verhaltens": "an informal check of the mood or behavior",
    "eine mutige, aber respektierte Meinung": "a bold but respected opinion",
    "eine positive Verwandlung, besonders im Aussehen": "a positive transformation, especially in appearance",
    "eine sehr attraktive Person": "a very attractive person",
    "eingeschnappt, nachtragend wegen einer Kleinigkeit": "sulky, holding a grudge over a small thing",
    "entspannen, nichts tun": "to relax, do nothing",
    "entspannt eine gute Stimmung genießen": "enjoying a good mood in a relaxed way",
    "etwas großartig meistern, brillieren": "to master something brilliantly, to shine",
    "etwas perfekt gemeistert, keine Kritikpunkte übrig gelassen": "nailed something perfectly, leaving nothing to criticize",
    "etwas wegschleudern, oder Ausruf der Begeisterung": "to fling something away, or an exclamation of excitement",
    "extrem lecker (über Essen)": "extremely tasty (about food)",
    "fühlt sich besonders oder anders gut an als sonst": "feels especially or differently good than usual",
    "ganz ehrlich, im Ernst": "honestly, seriously",
    "gedankliche Ermüdung durch zu viel bedeutungslosen Online-Content": "mental fatigue from too much meaningless online content",
    "gesellschaftlich oder öffentlich stark kritisiert/geächtet": "heavily criticized/ostracized socially or publicly",
    "im Ernst, ehrliche Ansage": "seriously, honest talk",
    "irgendwie, ein bisschen, eher heimlich gemeint": "somewhat, a bit, meant rather secretly",
    "ironische Antwort auf eine als altmodisch empfundene Aussage älterer Generationen": "ironic reply to a statement perceived as old-fashioned from older generations",
    "jemand mit gutem Charakter, verdient Respekt": "someone with good character who deserves respect",
    "jemand, der sich uninspiriert oder gleichförmig verhält (von 'Non-Player-Character')": "someone who acts uninspired or robotic (from 'Non-Player Character')",
    "jemand, der übertrieben um die Gunst einer Person buhlt": "someone who tries way too hard to win a person's favor",
    "jemanden systematisch verunsichern, damit er an der eigenen Wahrnehmung zweifelt": "systematically making someone doubt their own perception",
    "kein Scherz, das ist die Wahrheit": "no joke, that's the truth",
    "keine Lust haben": "to not be in the mood",
    "klar, abgemacht, einverstanden": "sure, deal, agreed",
    "kurze, leicht konsumierbare Online-Inhalte": "short, easily consumable online content",
    "lockere Anrede für einen Kumpel": "casual way to address a buddy",
    "man denkt ständig an etwas, ohne es zu wollen ('lebt mietfrei im Kopf')": "you constantly think about something without wanting to ('lives rent-free in your head')",
    "man steht zur eigenen, auch unpopulären Meinung — als Kompliment gemeint": "standing by your own, even unpopular, opinion — meant as a compliment",
    "mittelmäßig, nicht besonders gut": "mediocre, not particularly good",
    "nicht endlich": "not finite",
    "peinlich, fremdschämen-würdig": "embarrassing, cringe-worthy",
    "planlos, verwirrt, keinen Plan haben": "clueless, confused, having no idea",
    "plötzlich jeden Kontakt ohne Erklärung abbrechen": "suddenly cutting off all contact without explanation",
    "scherzhafter Spruch: sich einfach etwas einzureden hilft manchmal weiter": "joking saying: simply talking yourself into something sometimes helps",
    "schädlich für das eigene Wohlbefinden, ungesund (über Beziehungen/Verhalten)": "harmful to your wellbeing, unhealthy (about relationships/behavior)",
    "sehr unangenehm oder peinlich": "very awkward or embarrassing",
    "selbstbewusst auftreten, als wäre man die Hauptfigur des eigenen Lebens": "acting confidently as if you were the main character of your own life",
    "sich unrealistische Dinge einbilden (von 'delusional')": "imagining unrealistic things (from 'delusional')",
    "sich wünschen, dass zwei Personen ein Paar werden": "wishing that two people become a couple",
    "stylischer, auffälliger Kleidungsstil": "stylish, eye-catching clothing style",
    "verdächtig (von 'suspicious')": "suspicious",
    "verstanden, kein weiteres Wort nötig": "understood, no more words needed",
    "wenn eine Antwort mehr Zustimmung bekommt als der ursprüngliche Beitrag": "when a reply gets more approval than the original post",
    "wird benutzt um zu beschreiben, welchen Eindruck etwas macht": "used to describe the impression something gives",
    "z. B. AB3XQ9KP": "e.g. AB3XQ9KP",
    "z. B. Druckerpapier, Taxi zum Meeting…": "e.g. printer paper, taxi to meeting…",
    "z. B. Kundentermin Meyer GmbH": "e.g. client meeting Meyer Ltd",
    "z. B. Techniker Krankenkasse": "e.g. health insurance company",
    "z. B. Zahlbar innerhalb von 14 Tagen": "e.g. Payable within 14 days",
    "z. B. Zahlbar innerhalb von {n} Tagen": "e.g. Payable within {n} days",
    "z.B. AB12CD": "e.g. AB12CD",
    "z.B. Alex": "e.g. Alex",
    "z.B. CR-8F3K2Q": "e.g. CR-8F3K2Q",
    "z.B. LD-8F3K2Q": "e.g. LD-8F3K2Q",
    "z.B. SS-8F3K2Q": "e.g. SS-8F3K2Q",
    "z.B. SchachFuchs42": "e.g. ChessFox42",
    "ziemlich offensichtlich, total": "pretty obvious, totally",
    "{n} Level — Hindernissen ausweichen, die Strecke ins Ziel bringen": "{n} levels — dodge obstacles and make it to the finish",
    "{n} Scheiben": "{n} pieces",
    "{n} Tage": "{n} days",
    "{n} Züge gebraucht.": "{n} moves needed.",
    "{n} von {n} Spielern da...": "{n} of {n} players here...",
    "{n} € / Monat": "€{n} / month",
    "Österreich": "Austria",
    "Übersetzer": "Translator",
    "übertrieben, unnötig dramatisch": "exaggerated, unnecessarily dramatic",
    "‹ Zurück": "‹ Back",
    "← Andere Formel": "← Other formula",
    "← Modus wechseln": "← Change mode",
    "← Zurück": "← Back",
    "↩️ Links": "↩️ Left",
    "↪️ Rechts": "↪️ Right",
    "↺ Neu starten": "↺ Restart",
    "⚠️ Sprache konnte nicht erkannt werden — versuch es nochmal.": "⚠️ Speech could not be recognized — please try again.",
    "⚠️ Spracherkennung wird in diesem Browser nicht unterstützt.": "⚠️ Speech recognition is not supported in this browser.",
    "✓ Richtig!": "✓ Correct!",
    "➕ Raum erstellen": "➕ Create room",
    "⬆️ Vor": "⬆️ Forward",
    "🇦🇺 AUD — Australischer Dollar": "🇦🇺 AUD — Australian Dollar",
    "🇧🇬 BGN — Bulgarischer Lew": "🇧🇬 BGN — Bulgarian Lev",
    "🇨🇦 CAD — Kanadischer Dollar": "🇨🇦 CAD — Canadian Dollar",
    "🇨🇭 CHF — Schweizer Franken": "🇨🇭 CHF — Swiss Franc",
    "🇨🇿 CZK — Tschechische Krone": "🇨🇿 CZK — Czech Koruna",
    "🇩🇰 DKK — Dänische Krone": "🇩🇰 DKK — Danish Krone",
    "🇬🇧 GBP — Britisches Pfund": "🇬🇧 GBP — British Pound",
    "🇭🇰 HKD — Hongkong-Dollar": "🇭🇰 HKD — Hong Kong Dollar",
    "🇭🇺 HUF — Ungarischer Forint": "🇭🇺 HUF — Hungarian Forint",
    "🇮🇩 IDR — Indonesische Rupiah": "🇮🇩 IDR — Indonesian Rupiah",
    "🇮🇱 ILS — Israelischer Schekel": "🇮🇱 ILS — Israeli Shekel",
    "🇮🇳 INR — Indische Rupie": "🇮🇳 INR — Indian Rupee",
    "🇮🇳 Neu-Delhi": "🇮🇳 New Delhi",
    "🇯🇵 JPY — Japanischer Yen": "🇯🇵 JPY — Japanese Yen",
    "🇯🇵 Tokio": "🇯🇵 Tokyo",
    "🇰🇷 KRW — Südkoreanischer Won": "🇰🇷 KRW — South Korean Won",
    "🇲🇾 MYR — Malaysischer Ringgit": "🇲🇾 MYR — Malaysian Ringgit",
    "🇳🇴 NOK — Norwegische Krone": "🇳🇴 NOK — Norwegian Krone",
    "🇳🇿 NZD — Neuseeland-Dollar": "🇳🇿 NZD — New Zealand Dollar",
    "🇵🇭 PHP — Philippinischer Peso": "🇵🇭 PHP — Philippine Peso",
    "🇵🇱 PLN — Polnischer Zloty": "🇵🇱 PLN — Polish Zloty",
    "🇷🇴 RON — Rumänischer Leu": "🇷🇴 RON — Romanian Leu",
    "🇸🇪 SEK — Schwedische Krone": "🇸🇪 SEK — Swedish Krona",
    "🇸🇬 SGD — Singapur-Dollar": "🇸🇬 SGD — Singapore Dollar",
    "🇹🇭 THB — Thailändischer Baht": "🇹🇭 THB — Thai Baht",
    "🇹🇷 TRY — Türkische Lira": "🇹🇷 TRY — Turkish Lira",
    "🇿🇦 ZAR — Südafrikanischer Rand": "🇿🇦 ZAR — South African Rand",
    "🌍 Übersetzen": "🌍 Translate",
    "🌐 Online spielen": "🌐 Play online",
    "🎉 Gelöst in {n} Zügen!": "🎉 Solved in {n} moves!",
    "🎤 Höre zu…": "🎤 Listening…",
    "🎮 Los geht's": "🎮 Let's go",
    "🎮 Steuerung": "🎮 Controls",
    "🎮 Volles Spiele-Vergnügen": "🎮 Full gaming fun",
    "🎲 Kniffel — Modus wählen": "🎲 Yahtzee — Choose mode",
    "🏆 Ergebnis": "🏆 Result",
    "💥 Der Roboter ist gegen eine Wand/den Rand gefahren. Nochmal versuchen!": "💥 The robot hit a wall/the edge. Try again!",
    "📊 Statistik": "📊 Statistics",
    "📋 Regeln": "📋 Rules",
    "📖 Kniffel — Anleitung & Geschichte": "📖 Yahtzee — How to play & history",
    "📝 Prüfungssimulation starten (30 Fragen)": "📝 Start exam simulation (30 questions)",
    "📝 Prüfungssimulation starten ({n} Fragen)": "📝 Start exam simulation ({n} questions)",
    "🔊 Vorlesen": "🔊 Read aloud",
    "🔍 Durchsuchen — Kategorie oder Notiz…": "🔍 Search — category or note…",
    "🔑 Raum beitreten": "🔑 Join room",
    "🔔 Feiertags-Erinnerung": "🔔 Holiday reminder",
    "🔤 Wortsuche": "🔤 Word search",
    "🔴 Rot 🆚 🟡 Gelb": "🔴 Red 🆚 🟡 Yellow",
    "🔴 Rot, 🟢 Grün & 🟡 Gelb": "🔴 Red, 🟢 Green & 🟡 Yellow",
    "🔴 Rot, 🟢 Grün, 🟡 Gelb & 🔵 Blau": "🔴 Red, 🟢 Green, 🟡 Yellow & 🔵 Blue",
    "🗓️ Wochenmission": "🗓️ Weekly mission",
    "🚀 Rundum-sorglos: Spiele + Lernen": "🚀 All-inclusive: games + learning",
    "🤔 Noch nicht am Ziel. Passe dein Programm an und versuch es erneut.": "🤔 Not at the goal yet. Adjust your program and try again.",
    "🧪 Test-Erinnerung jetzt anzeigen": "🧪 Show test reminder now"
  };
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  // Gegenrichtung: englische Texte, die im Deutsch-Modus noch englisch erscheinen (z. B. neue Spiele-Texte)
  const DICT_DE = {
    "LAKHERANCE ARCADE • SIGNATURE GAME": "LAKHERANCE ARCADE • SIGNATUR-SPIEL",
    "Cinematic board physics • local, AI and online modes • choose your arena": "Kinoreife Brettphysik • lokal, gegen KI und online • wähle deine Arena",
    "Championship • Queen strategy • balanced physics": "Meisterschaft • Königin-Strategie • ausgewogene Physik",
    "10s Rush • fast rebounds • arcade pressure": "10-s-Rausch • schnelle Abpraller • Arcade-Druck",
    "Precision • tighter pockets • pro control": "Präzision • engere Taschen • Profi-Kontrolle",
    "Night challenge • long glide • 12s turns": "Nacht-Herausforderung • langes Gleiten • 12 s pro Zug",
    "Royal Championship": "Königliche Meisterschaft",
    "Classic balance • 15s turn • Queen strategy": "Klassische Balance • 15 s pro Zug • Königin-Strategie",
    "10s turns • faster shots • stronger rebounds": "10 s pro Zug • schnellere Schüsse • stärkere Abpraller",
    "Emerald Precision": "Smaragd-Präzision",
    "18s turns • tighter pockets • controlled physics": "18 s pro Zug • engere Taschen • kontrollierte Physik",
    "Midnight Challenge": "Mitternachts-Herausforderung",
    "12s turns • longest glide • night-pressure physics": "12 s pro Zug • längstes Gleiten • Nachtdruck-Physik",
    "⛶ FULLSCREEN": "⛶ VOLLBILD",
    "↙ NORMAL VIEW": "↙ NORMALE ANSICHT",
    "✦ CINEMA FX": "✦ KINO-EFFEKTE",
    "Designed by Gurpreet Singh": "Gestaltet von Gurpreet Singh",
    "Idea of Shree Gurpreet Singh ji": "Idee von Shree Gurpreet Singh ji",
    "PLAY • LEARN • CREATE": "SPIELEN • LERNEN • GESTALTEN"
  };
  const ORIG = new WeakMap();   // Textknoten -> deutscher Originaltext
  const DONE = new WeakMap();   // Textknoten -> gesetzte Übersetzung
  const ATTR_ORIG = new WeakMap(); // Element -> {attr: [orig, translated]}
  const NUM_RE = /\d+(?:[.,]\d+)?/g;

  function isEn() { try { return typeof state !== 'undefined' && state.lang === 'en'; } catch (e) { return false; } }
  function activeDict() { return isEn() ? DICT : DICT_DE; }

  function lookup(text) {
    if (!text) return null;
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t || !/[A-Za-zÄÖÜäöüß]/.test(t)) return null;
    const D = activeDict();
    let r = D[t];
    if (r === undefined && /\d/.test(t)) {
      const nums = [];
      const key = t.replace(NUM_RE, m => { nums.push(m); return '{n}'; });
      const tpl = D[key];
      if (tpl !== undefined) { let i = 0; r = tpl.replace(/\{n\}/g, () => (nums[i++] ?? '')); }
    }
    if (r === undefined) return null;
    const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    return lead + r + trail;
  }
  window.autoTranslateEn = function (s) { if (typeof s !== 'string') return s; const r = lookup(s); return r == null ? s : r; };

  function skipEl(el) {
    if (!el) return true;
    if (SKIP_TAGS[el.tagName]) return true;
    return !!(el.closest && el.closest('[data-no-autotr]'));
  }
  function trText(n) {
    const p = n.parentElement;
    if (skipEl(p)) return;
    const v = n.nodeValue;
    if (DONE.get(n) === v) return;
    const r = lookup(v);
    if (r != null && r !== v) { ORIG.set(n, v); DONE.set(n, r); n.nodeValue = r; }
  }
  function trAttrs(el) {
    if (!el || (el.closest && el.closest('[data-no-autotr]'))) return;
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (!v) continue;
      const rec = ATTR_ORIG.get(el) || {};
      if (rec[a] && rec[a][1] === v) continue;
      const r = lookup(v);
      if (r != null && r !== v) { rec[a] = [v, r]; ATTR_ORIG.set(el, rec); el.setAttribute(a, r); }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP_TAGS[root.tagName]) return; trAttrs(root); }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) trText(n);
      else if (n.hasAttribute && (n.hasAttribute('placeholder') || n.hasAttribute('title') || n.hasAttribute('aria-label'))) trAttrs(n);
    }
  }
  function restoreAll() {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) {
        if (ORIG.has(n) && n.nodeValue === DONE.get(n)) n.nodeValue = ORIG.get(n);
        ORIG.delete(n); DONE.delete(n);
      } else {
        const rec = ATTR_ORIG.get(n);
        if (rec) { for (const a in rec) if (n.getAttribute(a) === rec[a][1]) n.setAttribute(a, rec[a][0]); ATTR_ORIG.delete(n); }
      }
    }
  }

  let observer = null;
  function onMutations(list) {
    for (const m of list) {
      if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') trAttrs(m.target);
      else for (const node of m.addedNodes) walk(node);
    }
  }
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // Wird am Ende von applyAppLang() aufgerufen
  window.autoI18nRefresh = function () {
    startObserver();
    restoreAll();
    walk(document.body);
  };

  // Canvas-Texte (Spiele)
  try {
    const C = CanvasRenderingContext2D.prototype;
    ['fillText', 'strokeText', 'measureText'].forEach(fn => {
      const orig = C[fn];
      C[fn] = function (text, ...rest) {
        if (typeof text === 'string') { const r = lookup(text); if (r != null) text = r; }
        return orig.call(this, text, ...rest);
      };
    });
  } catch (e) {}
  // Hinweis-Fenster
  ['alert', 'confirm', 'prompt'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (msg, ...rest) {
      if (typeof msg === 'string') { const r = lookup(msg); if (r != null) msg = r; }
      if (fn === 'prompt' && typeof rest[0] === 'string') { const r2 = lookup(rest[0]); if (r2 != null) rest[0] = r2; }
      return orig.call(window, msg, ...rest);
    };
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.autoI18nRefresh());
  else window.autoI18nRefresh();
})();
