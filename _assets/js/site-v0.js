window.onscroll = function () {
  d = document.getElementById("little-me");
  if (window.scrollY > 240) {
    // if the classname isn't already set
    if (!d.className.match("visible")){ 
      d.className = d.className + " visible";
    }
  } else {
    d.className = d.className.replace(/visible/g, "");
  }
}