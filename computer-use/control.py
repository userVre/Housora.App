"""OS-level mouse/keyboard control via pyautogui. Use for general computer-use outside the browser DOM."""
import argparse
import sys
import time
import pyautogui

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.25

def cmd_move(x, y):
    pyautogui.moveTo(int(x), int(y))

def cmd_click(x=None, y=None, button="left", clicks=1):
    if x is not None and y is not None:
        pyautogui.click(int(x), int(y), button=button, clicks=int(clicks))
    else:
        pyautogui.click(button=button, clicks=int(clicks))

def cmd_doubleclick(x=None, y=None):
    if x is not None and y is not None:
        pyautogui.doubleClick(int(x), int(y))
    else:
        pyautogui.doubleClick()

def cmd_rightclick(x=None, y=None):
    cmd_click(x, y, button="right")

def cmd_scroll(amount):
    pyautogui.scroll(int(amount))

def cmd_type(text, interval=0.02):
    pyautogui.write(text, interval=interval)

def cmd_press(key):
    # key like 'enter', 'tab', 'ctrl+l', 'alt+tab'
    if "+" in key:
        keys = [k.strip() for k in key.split("+")]
        pyautogui.hotkey(*keys)
    else:
        pyautogui.press(key)

def cmd_hotkey(keys):
    pyautogui.hotkey(*keys.split("+"))

def cmd_pos():
    p = pyautogui.position()
    print(f"{p.x},{p.y}")
    return p

def cmd_size():
    s = pyautogui.size()
    print(f"{s.width}x{s.height}")
    return s

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Desktop control")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("move"); p.add_argument("x"); p.add_argument("y")
    p = sub.add_parser("click"); p.add_argument("--x", default=None); p.add_argument("--y", default=None); p.add_argument("--button", default="left"); p.add_argument("--clicks", default=1)
    p = sub.add_parser("doubleclick"); p.add_argument("--x", default=None); p.add_argument("--y", default=None)
    p = sub.add_parser("rightclick"); p.add_argument("--x", default=None); p.add_argument("--y", default=None)
    p = sub.add_parser("scroll"); p.add_argument("amount")
    p = sub.add_parser("type"); p.add_argument("text")
    p = sub.add_parser("press"); p.add_argument("key")
    p = sub.add_parser("hotkey"); p.add_argument("keys")
    p = sub.add_parser("pos")
    p = sub.add_parser("size")
    p = sub.add_parser("sleep"); p.add_argument("sec", type=float)
    a = ap.parse_args()
    if a.cmd == "move": cmd_move(a.x, a.y)
    elif a.cmd == "click": cmd_click(a.x, a.y, a.button, a.clicks)
    elif a.cmd == "doubleclick": cmd_doubleclick(a.x, a.y)
    elif a.cmd == "rightclick": cmd_rightclick(a.x, a.y)
    elif a.cmd == "scroll": cmd_scroll(a.amount)
    elif a.cmd == "type": cmd_type(a.text)
    elif a.cmd == "press": cmd_press(a.key)
    elif a.cmd == "hotkey": cmd_hotkey(a.keys)
    elif a.cmd == "pos": cmd_pos()
    elif a.cmd == "size": cmd_size()
    elif a.cmd == "sleep": time.sleep(a.sec)
