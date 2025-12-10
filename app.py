import streamlit as st

# ========== CONFIG ==========
st.set_page_config(page_title="Chu & Pa Love Game", page_icon="💘")

st.title("💘 Chu & Pa: Find Each Other!")
st.write(
    "Help **Chu** (🧡) find **Pa** (💜). "
    "Use the arrow buttons to move Chu. When they meet, love wins! 💞"
)

# ========== INIT GAME ==========
def init_game(grid_size: int = 7):
    st.session_state.grid_size = grid_size
    st.session_state.chu_pos = [0, 0]  # bottom-left
    st.session_state.pa_pos = [grid_size - 1, grid_size - 1]  # top-right
    st.session_state.moves = 0
    st.session_state.game_over = False

if "chu_pos" not in st.session_state:
    init_game()

# ========== SIDEBAR ==========
st.sidebar.header("Settings")

difficulty = st.sidebar.radio(
    "Grid Size",
    options=[5, 7, 9],
    index=[5, 7, 9].index(st.session_state.get("grid_size", 7)),
    format_func=lambda x: f"{x} x {x}"
)

if difficulty != st.session_state.grid_size:
    init_game(difficulty)

if st.sidebar.button("🔁 Reset Game"):
    init_game(st.session_state.grid_size)


# ========== MOVEMENT ==========
def move_chu(dx: int, dy: int):
    if st.session_state.game_over:
        return

    x, y = st.session_state.chu_pos
    size = st.session_state.grid_size

    new_x = min(max(x + dx, 0), size - 1)
    new_y = min(max(y + dy, 0), size - 1)

    st.session_state.chu_pos = [new_x, new_y]
    st.session_state.moves += 1

    # Check win
    if st.session_state.chu_pos == st.session_state.pa_pos:
        st.session_state.game_over = True
        st.success(f"💞 Chu found Pa in {st.session_state.moves} moves!")
        st.balloons()


# ========== CONTROLS ==========
st.subheader("Controls")

up = st.columns(3)
left = st.columns(3)

with up[1]:
    if st.button("⬆️ Up"):
        move_chu(0, 1)

with left[0]:
    if st.button("⬅️ Left"):
        move_chu(-1, 0)

with left[1]:
    if st.button("⬇️ Down"):
        move_chu(0, -1)

with left[2]:
    if st.button("➡️ Right"):
        move_chu(1, 0)


# ========== GRID DISPLAY ==========
st.subheader("Play Area")

size = st.session_state.grid_size
chu = st.session_state.chu_pos
pa = st.session_state.pa_pos

grid = []
for y in range(size - 1, -1, -1):
    row = []
    for x in range(size):
        if [x, y] == chu and [x, y] == pa:
            cell = "💘"
        elif [x, y] == chu:
            cell = "🧡"
        elif [x, y] == pa:
            cell = "💜"
        else:
            cell = "⬜"
        row.append(cell)
    grid.append(" ".join(row))

for line in grid:
    st.write(line)

# ========== INFO ==========
st.markdown("---")
st.write(f"**Chu position:** {tuple(chu)}")
st.write(f"**Pa position:** {tuple(pa)}")
st.write(f"**Moves used:** {st.session_state.moves}")

if st.session_state.game_over:
    st.info("Click **Reset Game** in the sidebar to play again!")
