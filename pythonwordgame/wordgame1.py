import random
import sqlite3

# Connect to the database
conn = sqlite3.connect('words.db')
c = conn.cursor()

# Function to retrieve a random word from the database
def get_random_word():
    c.execute("SELECT word FROM words ORDER BY RANDOM() LIMIT 1")
    return c.fetchone()[0]

# Function to display the game menu
def display_menu():
    print("\n\n")
    print(" _   _      _ _       ")
    print("| | | | ___| | | ___  ")
    print("| |_| |/ _ \\ | |/ _ \\ ")
    print("|  _  |  __/ | | (_) |")
    print("|_| |_|\\___|_|_|\\___/ ")
    print("\n")
    print("1. Play game")
    print("2. View high scores")
    print("3. Quit")

# Function to display the high scores
def display_high_scores():
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    cursor.execute('''SELECT name, score FROM scores ORDER BY score DESC LIMIT 10''')
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) == 0:
        print("There are no high scores yet.")
    else:
        print("High Scores:")
        for row in rows:
            print(f"{row[0]}: {row[1]}")

# Function to update the high scores
def update_high_scores(name, score):
    c.execute("INSERT INTO scores (name, score) VALUES (?, ?)", (name, score))
    conn.commit()

# Function to play the game
def play_game():
    word = get_random_word()
    letters = set(word)
    guessed_letters = set()
    num_chances = 3
    while num_chances > 0:
        print("\n\n")
        print("Guess the word: ", end="")
        for letter in word:
            if letter in guessed_letters:
                print(letter, end="")
            else:
                print("_", end="")
        guess = input("\nGuess a letter: ")
        if guess in letters:
            guessed_letters.add(guess)
            if guessed_letters == letters:
                print("\nYou win!")
                name = input("Enter your name: ")
                update_high_scores(name, num_chances)
                return
        else:
            print("\nIncorrect!")
            num_chances -= 1
    print("\nYou lose!")

# Main function to run the game
def main():
    # Create the words table if it doesn't exist
    c.execute("CREATE TABLE IF NOT EXISTS words (word TEXT)")
   
    # Create the scores table if it doesn't exist
    c.execute("CREATE TABLE IF NOT EXISTS scores (name TEXT, score INTEGER)")
    while True:
        display_menu()
        choice = input("Enter your choice: ")
        if choice == "1":
            play_game()
        elif choice == "2":
            display_high_scores()
        elif choice == "3":
            break
        else:
            print("\nInvalid choice. Try again.")
    conn.close()

if __name__ == '__main__':
    main()
