# Image Difference

## Difference
- [ ] ==Overlay should use same tone mapping as image to avoid dark images==
- [ ] Detect geometry changes? (using depth maps or other means)
- [x] Adjust max difference value (+ change max computation)
- [x] Change the shader to show the difference as a diverging color map (such as seismic or bwr)
- [x] Overlay with one of the original images
- [x] Try other color maps? --> slightly changed white to yellow for the overlay

## Dialog
- [ ] ==Aspect ratio of the dialog does not change dynamically (either initially) to take into account texture's aspect ratio==
- [ ] Show background and make it resizable / movable?
- [ ] Make it responsive -> if window changes size's of dialog and canvas are incorrect
- [ ] Control pannels should be collapsed when the dialog opens, and extended when the dialog closes
- [ ] See how to integrate it with the main UI --> replace image instead of opening dialog?


# Image Loading

- [ ] Set image size according to aspect ratio when loading images
- [ ] Resize images for faster uploading?
- [ ] Check if tone mapping change after updating an image is correct
- [X] Unify EXR loaders + put on a separate file?
  - [X] Remove statistics output too?
- [X] Update images


# UI

- [ ] Improve image selection
- [x] Add image selection --> dropdowns for now
- [x] Reorganize GUI


# Others

