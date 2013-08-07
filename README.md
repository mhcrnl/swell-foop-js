Felp Swool
==========

A game similar to Gnome Games' Swell Foop written in HTML and JavaScript


Description
-----------

Gameplay consists of clicking on blocks. When a block is clicked, if that block is part of a contiguous
group of blocks of the same color, then all the blocks in the group disappear.

When a block disappears, if there are any blocks above it, they fall down
and occupy the space previously occupied by the block that disappeared.
If an entire column disappears, then the column to the right moves to take
its place.

The goal is to cause as many blocks to disappear as possible.


How to use
----------

 1. In the terminal, navigate to a fun directory and type 'git clone https://github.com/zfletch/swell-foop-js'
 2. Download the latest version of jQuery (http://jquery.com/download/) to that directory
 3. Download jQuery Color (https://github.com/jquery/jquery-color) to that directory
 4. Download underscore.js (http://underscorejs.org/) to that directory
 5. In blocks.html: make sure that the script tags' src attributes match the names of the libraries you downloaded in the previous steps.
 6. Open blocks.html in your favorite web browser and enjoy
