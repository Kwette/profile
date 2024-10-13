function collapse(elt){
  const currentIcone = elt.querySelector("i");
  elt.closest('.one-project').querySelector(".app-details").classList.toggle("hidden")
  if (currentIcone.classList.contains("fa-plus")){
    currentIcone.classList.replace("fa-plus", "fa-minus");
  } else {
    currentIcone.classList.replace("fa-minus", "fa-plus");
  }
}
