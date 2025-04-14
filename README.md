# Filer
 web-based cloud storage that dosent suck


todo:
 - take the body of a file creation request and use it as the content of the file
 - add a way to move/rename files - can probably just make a move and it will work the same way as unix mv
 - add the username of the authenticated user to fs requests as a way of isolating users data (idk if this is the best way)

known issues:
 - it might be possible to put ".." in the path to get out of the folder? not sure - will check
