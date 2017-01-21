# Why Atari?

The Atari Video Computer System (later renamed the Atari 2600) is an interesting machine. For one thing, while not the first in its category, it is the machine that popularized the concept of a *home videogame console* using interchangeable cartridges.

But it had one interesting point of contrast to videogame consoles of today, or to how the development of graphic interfaces is done. One that sounded absurd even at that time, and that is difficult to explain today: it had no frame buffer. Instead, it relied on a line buffer.

In practice, it means that instead of drawing anything (like player sprites, background scenario, etc) to a virtual, in-memory screen that would later be displayed on a TV set, Atari games had to draw their content to the screen pretty much *as the cathode rays are displaying it on the TV set*, one line at a time. The processor's clock cycles are thus directly tied to the speed the TV screen is drawn.

With that race against an electron beam, and an extremely limited 128 *bytes* of memory, creating an Atari game during its time was nothing short of a work of creative genius. And that's probably part of why a [homebrew](https://en.wikipedia.org/wiki/Atari_2600_homebrew) scene was born for the Atari 2600, and why it's such a popular platform for [demakes](http://bogost.com/teaching/atari_hacks_remakes_and_demake/) such as [Halo 2600](http://atariage.com/forums/topic/166916-halo-for-the-2600-released-at-cge-download-the-game-here/?p=2062848).

Since reading about the Atari's limitations, and (maybe especially) after reading the book [Racing the Beam](https://en.wikipedia.org/wiki/Racing_the_Beam) by Nick Montfort and Ian Bogost (check a review [here](https://www.wired.com/2009/03/racing-the-beam/)), creating an Atari VCS game has been in my development bucket list. I knew of compilers like [dasm](http://dasm-dillon.sourceforge.net/) and emulators like [Stella](https://stella-emu.github.io/), and had dabbled on writing some simple assembly for it (or modifying existing code), but haven't done much more than that.

However, after seeing [8bitworkshop's web-based Atari 2600 development IDE](http://8bitworkshop.com), this itch to create an Atari game only intensified. I dreamed of a modern Atari development IDE; one that could provide all the features I've learned to expect from other programming languages (like auto-completion, error checking, easy navigation, etc), all allied to the easiness of seeing something updating in real time, as the code is modified.

If the hallmark of inneficient developers is a certain proficieny of creating tasks for him/herself, then I'm Inneficient Developer Supreme; [this scene](http://www.dailymotion.com/video/x2gp98t) comes to mind. So, to pursue my goal of developing an Atari game, I decided to first create a Visual Studio Code extension that provided all the modern development features I wanted. And this is that extension.

That goal had task dependencies of itself. For starters, I had to [port the original dasm to JavaScript using emscripten](https://github.com/zeh/dasmjs); this is what this extension is heavily based on.