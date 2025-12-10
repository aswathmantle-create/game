import streamlit as st

# ================== PAGE CONFIG ==================
st.set_page_config(page_title="CHUPA", page_icon="💘")

st.title("💘 Chu & Pa: Find Each Other!")
st.write(
    "Help **Chu** (🧡) find **Pa** (💜).\n\n"
    "Click the arrow buttons to move Chu on the grid. "
    "When Chu reaches Pa, love wins! 💞"
)

# ================== INIT GAME STATE ==================
def init_game(grid_size: int = 7):
    st.session_state.grid_size = grid_size
    st.session_state.chu_pos = [0, 0]  # bottom-left
    st.session_state.pa_pos = [grid_size - 1, grid_size - 1]  # top-right
    st.session_state.moves = 0
    st.session_state.game_over = False

# First-time setup
if "chu_pos" not in st.session_state:
    init_game()

# ================== SIDEBAR SETTINGS ==================
st.sidebar.header("Settings")

current_grid_size = st.session_state.get("grid_size", 7)

difficulty = st.sidebar.radio(
    "Grid Size",
    options=[5, 7, 9],
    index=[5, 7, 9].index(current_grid_size),
    format_func=lambda x: f"{x} x {x}",
    key="grid_size_radio",
)

# If user changes grid size -> reset game
if difficulty != current_grid_size:
    init_game(difficulty)

# Reset button
if st.sidebar.button("🔁 Reset Game", key="reset_button"):
    init_game(st.session_state.grid_size)

# ================== MOVEMENT LOGIC ==================
def move_chu(dx: int, dy: int):
    if st.session_state.game_over:
        return

    x, y = st.session_state.chu_pos
    size = st.session_state.grid_size

    new_x = min(max(x + dx, 0), size - 1)
    new_y = min(max(y + dy, 0), size - 1)

    st.session_state.chu_pos = [new_x, new_y]
    st.session_state.moves += 1

    # Check win condition
    if st.session_state.chu_pos == st.session_state.pa_pos:
        st.session_state.game_over = True
        st.success(f"💞 Chu found Pa in {st.session_state.moves} moves!")
        st.balloons()

# ================== CONTROLS ==================
st.subheader("Controls")

# Up button row
up_cols = st.columns(3)
with up_cols[1]:
    if st.button("⬆️ Up", key="btn_up"):
        move_chu(0, 1)

# Left / Down / Right row
mid_cols = st.columns(3)
with mid_cols[0]:
    if st.button("⬅️ Left", key="btn_left"):
        move_chu(-1, 0)

with mid_cols[1]:
    if st.button("⬇️ Down", key="btn_down"):
        move_chu(0, -1)

with mid_cols[2]:
    if st.button("➡️ Right", key="btn_right"):
        move_chu(1, 0)

# ================== GRID DISPLAY ==================
st.subheader("Play Area")

size = st.session_state.grid_size
chu_x, chu_y = st.session_state.chu_pos
pa_x, pa_y = st.session_state.pa_pos

grid_lines = []
for y in range(size - 1, -1, -1):  # top row first
    row_cells = []
    for x in range(size):
        if [x, y] == st.session_state.chu_pos and [x, y] == st.session_state.pa_pos:
            cell = "💘"
        elif [x, y] == st.session_state.chu_pos:
            cell = "🧡"  # Chu
        elif [x, y] == st.session_state.pa_pos:
            cell = "💜"  # Pa
        else:
            cell = "⬜"
        row_cells.append(cell)
    grid_lines.append(" ".join(row_cells))

for line in grid_lines:
    st.write(line)

# ================== INFO / DEBUG ==================
st.markdown("---")
st.write(f"**Chu position:** {tuple(st.session_state.chu_pos)}")
st.write(f"**Pa position:** {tuple(st.session_state.pa_pos)}")
st.write(f"**Moves used:** {st.session_state.moves}")
st.write(f"**Grid size:** {st.session_state.grid_size} x {st.session_state.grid_size}")

if st.session_state.game_over:
    st.info("Chu & Pa are together! Use **Reset Game** in the sidebar to play again 💘")
