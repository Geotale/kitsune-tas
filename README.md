# What is this?
This reposity hosts tools intended for creating TASes of Google Doodle Champion Island Games. This includes features such as
- Savestates
- Slowdown/speedup
- Inputting

# How to use?
Although there are keybinds for savestates (1-5 saves state 1-5, 6-0 loads state 1-5), most other things do not have much of a convenient way to access other
than modifying the code itself.
Settings:
- speed: The modifier for the speed of the game. 2x speed means it will try to run 2x as fast, 0.5x means it will try to run half as fast.
- tooFastFrames: How many frames to not render in the event that you're attempting to run the game too fast. This still has its limits, but is generally a tiny bit faster.

# TODO List
- Create a UI for creating inputs, changing speed, etc
- Fix issue upon trying to load an idle savestate when rolling
- Possibly fix issues with inconsistency at higher speeds?
