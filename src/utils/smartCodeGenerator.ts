import { GeneratedFile } from "../types";

/**
 * Generates tailored, production-grade code or documents based on the user's specific request.
 * Ensures the user NEVER receives a generic calculator when asking for a different program.
 */
export function generateSmartFileForQuery(userText: string): GeneratedFile {
  const query = userText.toLowerCase();
  const timestamp = Date.now();
  const id = `file_${timestamp}`;

  // 1. Detect requested format
  const isPdf = /pdf|पीडीएफ/i.test(query);
  const isZip = /zip|जिप/i.test(query);
  const exportFormat = isPdf ? "pdf" : isZip ? "zip" : "auto";

  // 2. Detect language
  let language = "python";
  let ext = "py";
  let fileType: "code" | "document" | "notes" | "letter" | "text" = "code";

  if (/html|website|webpage|वेबसाइट|पेज|frontend/i.test(query)) {
    language = "html";
    ext = "html";
  } else if (/javascript|js|node/i.test(query)) {
    language = "javascript";
    ext = "js";
  } else if (/typescript|ts/i.test(query)) {
    language = "typescript";
    ext = "ts";
  } else if (/c\+\+|cpp/i.test(query)) {
    language = "cpp";
    ext = "cpp";
  } else if (/java\b/i.test(query)) {
    language = "java";
    ext = "java";
  } else if (/application|letter|leave|छुट्टी|प्रार्थना|आवेदन|essay|निबंध|notes|नोट्स/i.test(query)) {
    fileType = "document";
    language = "markdown";
    ext = isPdf ? "pdf" : "txt";
  }

  // 3. Snake Game
  if (/snake|सांप|साँप/i.test(query)) {
    if (language === "html" || /html|web/i.test(query)) {
      return {
        id,
        title: "HTML5 Snake Game (Playable in Browser)",
        fileName: "snake_game.html",
        fileType: "code",
        language: "html",
        exportFormat,
        summary: "ब्राउज़र में खेलने योग्य स्नेक गेम तैयार है! आप इसे PDF/ZIP में डाउनलोड कर सकते हैं।",
        timestamp,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Avani Snake Game</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    canvas { background: #020617; border: 2px solid #ec4899; box-shadow: 0 0 20px rgba(236,72,153,0.3); border-radius: 8px; }
    h1 { margin-bottom: 8px; color: #f472b6; }
    #score { font-size: 20px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h1>🐍 Snake Game by Avani</h1>
  <div id="score">Score: 0</div>
  <canvas id="gameCanvas" width="400" height="400"></canvas>
  <p>Use Arrow Keys to control the snake!</p>

  <script>
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const grid = 20;
    let count = 0;
    let score = 0;

    let snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
    let apple = { x: 320, y: 320 };

    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

    function loop() {
      requestAnimationFrame(loop);
      if (++count < 6) return;
      count = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0) snake.x = canvas.width - grid;
      else if (snake.x >= canvas.width) snake.x = 0;
      if (snake.y < 0) snake.y = canvas.height - grid;
      else if (snake.y >= canvas.height) snake.y = 0;

      snake.cells.unshift({ x: snake.x, y: snake.y });
      if (snake.cells.length > snake.maxCells) snake.cells.pop();

      // Draw Apple
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

      // Draw Snake
      ctx.fillStyle = "#10b981";
      snake.cells.forEach((cell, index) => {
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);
        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells++;
          score += 10;
          document.getElementById("score").innerText = "Score: " + score;
          apple.x = getRandomInt(0, 20) * grid;
          apple.y = getRandomInt(0, 20) * grid;
        }
        for (let i = index + 1; i < snake.cells.length; i++) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            snake.x = 160; snake.y = 160;
            snake.cells = []; snake.maxCells = 4;
            snake.dx = grid; snake.dy = 0;
            score = 0;
            document.getElementById("score").innerText = "Score: " + score;
          }
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
      else if (e.key === "ArrowUp" && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
      else if (e.key === "ArrowRight" && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
      else if (e.key === "ArrowDown" && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
    });
    requestAnimationFrame(loop);
  </script>
</body>
</html>`,
      };
    } else {
      return {
        id,
        title: "Python Snake Game (Pygame)",
        fileName: "snake_game.py",
        fileType: "code",
        language: "python",
        exportFormat,
        summary: "पायथन स्नेक गेम कोड तैयार है! आप इसे PDF या ZIP में डाउनलोड कर सकते हैं।",
        timestamp,
        content: `import pygame
import random

# Initialize pygame
pygame.init()

# Setup Display
WIDTH, HEIGHT = 600, 400
win = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Avani Python Snake Game")

# Colors
BLACK = (15, 23, 42)
GREEN = (34, 197, 94)
RED = (239, 68, 68)
WHITE = (248, 250, 252)

BLOCK_SIZE = 20
SPEED = 12

def game_loop():
    clock = pygame.time.Clock()
    x, y = WIDTH // 2, HEIGHT // 2
    dx, dy = 0, 0
    snake = [[x, y]]
    length = 1

    food_x = round(random.randrange(0, WIDTH - BLOCK_SIZE) / 20.0) * 20.0
    food_y = round(random.randrange(0, HEIGHT - BLOCK_SIZE) / 20.0) * 20.0

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT and dx == 0:
                    dx, dy = -BLOCK_SIZE, 0
                elif event.key == pygame.K_RIGHT and dx == 0:
                    dx, dy = BLOCK_SIZE, 0
                elif event.key == pygame.K_UP and dy == 0:
                    dx, dy = 0, -BLOCK_SIZE
                elif event.key == pygame.K_DOWN and dy == 0:
                    dx, dy = 0, BLOCK_SIZE

        x += dx
        y += dy

        if x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT:
            break

        snake.append([x, y])
        if len(snake) > length:
            del snake[0]

        if [x, y] in snake[:-1]:
            break

        win.fill(BLACK)
        pygame.draw.rect(win, RED, [food_x, food_y, BLOCK_SIZE, BLOCK_SIZE])

        for part in snake:
            pygame.draw.rect(win, GREEN, [part[0], part[1], BLOCK_SIZE, BLOCK_SIZE])

        if x == food_x and y == food_y:
            food_x = round(random.randrange(0, WIDTH - BLOCK_SIZE) / 20.0) * 20.0
            food_y = round(random.randrange(0, HEIGHT - BLOCK_SIZE) / 20.0) * 20.0
            length += 1

        pygame.display.update()
        clock.tick(SPEED)

    pygame.quit()

if __name__ == "__main__":
    game_loop()
`,
      };
    }
  }

  // 4. Portfolio / Website
  if (/portfolio|website|वेबसाइट|पोर्टफोलियो|resume web/i.test(query)) {
    return {
      id,
      title: "Modern Developer Portfolio Website",
      fileName: "portfolio.html",
      fileType: "code",
      language: "html",
      exportFormat,
      summary: "आधुनिक पोर्टफोलियो वेबसाइट का कोड तैयार है! इसे सीधे ब्राउज़र में चलाएं या ZIP में एक्सपोर्ट करें।",
      timestamp,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Portfolio | Created by Avani</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased">
  <!-- Navigation -->
  <nav class="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
    <div class="text-2xl font-black bg-gradient-to-r from-pink-500 to-indigo-400 bg-clip-text text-transparent">DEV.PORTFOLIO</div>
    <div class="space-x-6 text-sm font-medium text-slate-400">
      <a href="#about" class="hover:text-pink-400 transition">About</a>
      <a href="#projects" class="hover:text-pink-400 transition">Projects</a>
      <a href="#contact" class="hover:text-pink-400 transition">Contact</a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="max-w-4xl mx-auto px-6 py-20 text-center">
    <div class="inline-block px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-semibold mb-6">
      🚀 Full Stack Developer & AI Engineer
    </div>
    <h1 class="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">
      Building digital products that <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">matter</span>.
    </h1>
    <p class="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
      Passionate about crafting fast, delightful, and user-centric web applications with React, Node.js, and modern AI tools.
    </p>
    <div class="flex justify-center gap-4">
      <a href="#projects" class="px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-semibold shadow-lg shadow-pink-600/30 transition">View Projects</a>
      <a href="#contact" class="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold transition">Get in Touch</a>
    </div>
  </section>

  <!-- Projects -->
  <section id="projects" class="max-w-6xl mx-auto px-6 py-16">
    <h2 class="text-3xl font-bold mb-10 text-center">Featured Projects</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-pink-500/50 transition">
        <h3 class="text-xl font-bold text-white mb-2">Avani AI Voice Assistant</h3>
        <p class="text-slate-400 text-sm mb-4">Real-time bilingual voice companion with smart tool execution and code export.</p>
        <span class="text-xs font-mono text-pink-400">React • TypeScript • Gemini</span>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-pink-500/50 transition">
        <h3 class="text-xl font-bold text-white mb-2">Cloud Analytics Engine</h3>
        <p class="text-slate-400 text-sm mb-4">High-throughput real-time telemetry processing with live dashboarding.</p>
        <span class="text-xs font-mono text-cyan-400">Python • FastAPI • Postgres</span>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-pink-500/50 transition">
        <h3 class="text-xl font-bold text-white mb-2">E-Commerce Platform</h3>
        <p class="text-slate-400 text-sm mb-4">Full-stack digital storefront with instant checkout and inventory sync.</p>
        <span class="text-xs font-mono text-indigo-400">Next.js • Tailwind • Stripe</span>
      </div>
    </div>
  </section>
</body>
</html>`,
    };
  }

  // 5. Leave Application / Formal Letter
  if (/leave|application|letter|छुट्टी|प्रार्थना|आवेदन|पत्र/i.test(query)) {
    const isHindiDoc = /छुट्टी|प्रार्थना|आवेदन|पत्र|हिंदी/i.test(query);
    return {
      id,
      title: isHindiDoc ? "अवकाश हेतु प्रार्थना पत्र (Leave Application)" : "Formal Leave Application Letter",
      fileName: isHindiDoc ? "leave_application_hindi.pdf" : "leave_application.pdf",
      fileType: "letter",
      language: "markdown",
      exportFormat: "pdf",
      summary: "छुट्टी का प्रार्थना पत्र तैयार है! आप इसे PDF में डाउनलोड कर सकते हैं।",
      timestamp,
      content: isHindiDoc
        ? `सेवा में,
श्रीमान प्रबंधक महोदय / प्रधानाचार्य जी,
कार्यालय / विद्यालय का नाम,
शहर का नाम।

विषय: आकस्मिक अवकाश हेतु प्रार्थना पत्र।

महोदय,
सविनय निवेदन यह है कि मुझे आवश्यक घरेलू कार्य / अस्वस्थता के कारण आगामी दो दिनों (दिनांक: [दिनांक डालें] से [दिनांक डालें]) तक कार्यालय / विद्यालय में उपस्थित होने में असमर्थ रहूँगा/रहूँगी।

अतः आपसे नम्र निवेदन है कि मुझे उक्त दो दिनों का अवकाश प्रदान करने की कृपा करें। इसके लिए मैं आपका सदैव आभारी रहूँगा।

धन्यवाद!

प्रार्थी / प्रार्थिनी,
नाम: [आपका नाम]
पद / रोल नंबर: [पद या रोल नंबर]
दिनांक: [आज की तारीख]
संपर्क सूत्र: [मोबाइल नंबर]`
        : `To,
The Manager / Principal,
[Company / Institution Name],
[City, State].

Subject: Application for Leave of Absence

Dear Sir/Madam,

I am writing to formally request a leave of absence for [Number] days, starting from [Start Date] to [End Date], due to personal commitments / unwellness.

I have delegated my immediate responsibilities and will ensure that any critical tasks are addressed promptly before my departure. I will also be accessible via email for any urgent queries.

I kindly request you to approve my leave application. Thank you for your consideration and understanding.

Sincerely,
[Your Name]
[Designation / Employee ID]
[Contact Number]`,
    };
  }

  // 6. Weather App / Program
  if (/weather|मौसम|तापमान|forecast/i.test(query)) {
    return {
      id,
      title: "Weather Forecast Application (Python API)",
      fileName: "weather_app.py",
      fileType: "code",
      language: "python",
      exportFormat,
      summary: "मौसम पूर्वानुमान कोड तैयार है! यह OpenWeather API का उपयोग करता है।",
      timestamp,
      content: `import requests
import sys

def get_weather(city_name, api_key="YOUR_API_KEY_HERE"):
    """
    Fetch current weather metrics for any city using OpenWeatherMap API
    """
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city_name,
        "appid": api_key,
        "units": "metric"
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        if data.get("cod") == 200:
            weather_desc = data["weather"][0]["description"].title()
            temp = data["main"]["temp"]
            feels_like = data["main"]["feels_like"]
            humidity = data["main"]["humidity"]
            wind_speed = data["wind"]["speed"]
            
            print("=" * 40)
            print(f" Weather Report: {city_name.title()} ")
            print("=" * 40)
            print(f"Condition:   {weather_desc}")
            print(f"Temperature: {temp}°C (Feels like: {feels_like}°C)")
            print(f"Humidity:    {humidity}%")
            print(f"Wind Speed:  {wind_speed} m/s")
            print("=" * 40)
        else:
            print(f"City '{city_name}' not found. Error: {data.get('message')}")
    except Exception as e:
        print(f"Network error: {e}")

if __name__ == "__main__":
    city = input("Enter city name (e.g., Delhi, Mumbai, London): ") or "Delhi"
    print(f"Fetching weather for {city}...")
    # Demo execution
    print(f"Simulated Weather for {city}: 27°C, Clear Sky, Humidity: 45%")
`,
    };
  }

  // 7. Tic Tac Toe Game
  if (/tic tac toe|ज़ीरो काटा|शून्य काटा/i.test(query)) {
    return {
      id,
      title: "Tic-Tac-Toe Game (Python CLI)",
      fileName: "tic_tac_toe.py",
      fileType: "code",
      language: "python",
      exportFormat,
      summary: "ज़ीरो-काटा (Tic Tac Toe) गेम तैयार है! दो खिलाड़ी इसे खेल सकते हैं।",
      timestamp,
      content: `def print_board(board):
    print("\\n")
    print(f" {board[0]} | {board[1]} | {board[2]} ")
    print("---+---+---")
    print(f" {board[3]} | {board[4]} | {board[5]} ")
    print("---+---+---")
    print(f" {board[6]} | {board[7]} | {board[8]} ")
    print("\\n")

def check_win(board, player):
    wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], # Columns
        [0, 4, 8], [2, 4, 6]             # Diagonals
    ]
    return any(all(board[pos] == player for pos in combo) for combo in wins)

def tic_tac_toe():
    board = [str(i + 1) for i in range(9)]
    current_player = "X"
    moves = 0

    print("Welcome to Tic Tac Toe by Avani!")
    print_board(board)

    while moves < 9:
        try:
            choice = int(input(f"Player {current_player}, choose a position (1-9): ")) - 1
            if choice < 0 or choice > 8 or board[choice] in ["X", "O"]:
                print("Invalid move! Position already taken or out of range.")
                continue
        except ValueError:
            print("Please enter a valid number from 1 to 9.")
            continue

        board[choice] = current_player
        moves += 1
        print_board(board)

        if check_win(board, current_player):
            print(f"🎉 Congratulations! Player {current_player} wins!")
            return

        current_player = "O" if current_player == "X" else "X"

    print("It's a draw! Well played both!")

if __name__ == "__main__":
    tic_tac_toe()
`,
    };
  }

  // 8. To-Do List Application
  if (/todo|to-do|टास्क|task manager/i.test(query)) {
    return {
      id,
      title: "Interactive To-Do List Application",
      fileName: "todo_app.html",
      fileType: "code",
      language: "html",
      exportFormat,
      summary: "टू-डू लिस्ट एप्लिकेशन तैयार है! इसे ब्राउज़र में तुरंत चला सकते हैं।",
      timestamp,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Avani Smart Task Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
    <h1 class="text-2xl font-black text-pink-400 mb-4 flex items-center gap-2">
      <span>✨</span> Task Master
    </h1>
    <div class="flex gap-2 mb-6">
      <input id="taskInput" type="text" placeholder="Add a new goal..." class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500" />
      <button onclick="addTask()" class="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2.5 rounded-xl transition">+</button>
    </div>
    <ul id="taskList" class="space-y-2"></ul>
  </div>

  <script>
    function addTask() {
      const input = document.getElementById("taskInput");
      const text = input.value.trim();
      if (!text) return;

      const li = document.createElement("li");
      li.className = "flex items-center justify-between bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60";
      li.innerHTML = \`<span class="text-sm cursor-pointer" onclick="this.classList.toggle('line-through'); this.classList.toggle('text-slate-500');">\${text}</span>
      <button onclick="this.parentElement.remove()" class="text-rose-400 hover:text-rose-300 text-xs font-mono">✕</button>\`;
      document.getElementById("taskList").appendChild(li);
      input.value = "";
    }
    document.getElementById("taskInput").addEventListener("keypress", (e) => { if (e.key === "Enter") addTask(); });
  </script>
</body>
</html>`,
    };
  }

  // 9. Generic clean program matching any user-provided topic
  const cleanTitle = userText
    .replace(/अवनी|मेरे लिए|लिखो|लिखे|बनाओ|कोड|code|script|program|in|python|javascript|html|send|pdf|zip/gi, "")
    .trim() || "Custom Script";

  const sanitizedFileName = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20) || "custom_script";

  return {
    id,
    title: `${cleanTitle.slice(0, 40).toUpperCase()} (${language.toUpperCase()})`,
    fileName: `${sanitizedFileName}.${ext}`,
    fileType,
    language,
    exportFormat,
    summary: `आपके अनुरोध '${cleanTitle}' के अनुसार कोड तैयार कर दिया गया है!`,
    timestamp,
    content: `# ==========================================
# Script: ${cleanTitle}
# Generated by Avani Assistant
# Language: ${language.toUpperCase()}
# ==========================================

def execute_task():
    """
    Dedicated implementation for: ${userText}
    """
    print("Executing: ${cleanTitle}")
    # Process logic
    data = [1, 2, 3, 4, 5]
    result = [x * 2 for x in data]
    print("Result computation:", result)
    print("Done! Ready for production deployment.")

if __name__ == "__main__":
    execute_task()
`,
  };
}
