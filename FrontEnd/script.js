const baseURL = "http://localhost:5678/api/";
const filterContainer = document.getElementById("FiltersContainer");
const loginButton = document.getElementById("loginButton");
const editionContainer = document.getElementById("editionContainer");
const IconPortfolio = document.querySelector(".icon-portfolio");
const selectImage = document.querySelector(".upload-img");
const inputFile = document.querySelector("#file");
const imgArea = document.querySelector(".img-area");

let availableCategories = [];

//******* Gestion de l'affichage de l'interface utilisateur (UI) en fonction de l'état de connexion de l'utilisateur
function updateUIBasedOnLogin() {
  // // Récupère l'état de connexion depuis LocalStorage
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Met à jour l'affichage Connexion/Déconnexion
  loginButton.textContent = isLoggedIn ? "logout" : "login";

  // Quand Connecté
  if (isLoggedIn) {
    filterContainer.style.display = "none";
    editionContainer.style.display = "";
    IconPortfolio.style.display = "";
  }
  // Quand Déconnecté
  else {
    filterContainer.style.display = "";
    editionContainer.style.display = "none";
    IconPortfolio.style.display = "none";
  }

  // Ajoute un écouteur d'événement de clic sur le bouton de connexion (loginButton).
  loginButton.addEventListener("click", () => {
    // Vérifie si l'utilisateur est actuellement connecté en examinant la variable isLoggedIn.
    if (isLoggedIn) {
      // Si l'utilisateur est connecté (isLoggedIn est vrai), exécute les actions suivantes pour se déconnecter :

      // Supprime l'indicateur de connexion du stockage local, ce qui efface l'état de connexion persistant.
      localStorage.removeItem("isLoggedIn");
      // Supprime également le token d'authentification du stockage local.
      localStorage.removeItem("token");

      // Met à jour la variable d'état de connexion pour refléter que l'utilisateur n'est plus connecté.
      isLoggedIn = false;
      // Rafraîchit la page pour réinitialiser l'état de l'interface utilisateur en fonction du nouvel état de connexion.
      window.location.reload();
    } else {
      // Si l'utilisateur n'est pas connecté (isLoggedIn est faux), redirige vers la page de connexion.
      window.location.href = "login.html";
    }
  });
}

//******* Écoute l'événement 'DOMContentLoaded' pour s'assurer que le DOM est complètement chargé avant d'exécuter le code
document.addEventListener("DOMContentLoaded", function () {
  // Appelle la fonction pour charger les projets depuis l'API
  fetchAndDisplayProjects();
  setupModal();
  updateUIBasedOnLogin();
  setupProjectSubmission();
});

//******* Fonction pour charger les projets et les catégories depuis l'API et les afficher
function fetchAndDisplayProjects() {
  // Assurez-vous que les catégories sont chargées avant de traiter les projets
  fetch(baseURL + "categories")
    .then((response) => response.json())
    .then((categoriesData) => {
      availableCategories = categoriesData;
      displayFilterButtons(categoriesData);
    });

  fetch(baseURL + "works")
    .then((response) => response.json())
    .then((data) => {
      const projectsWithCompleteCategories = data.map(completeProjectCategory);
      displayProjects(projectsWithCompleteCategories);
    })
    .catch((error) =>
      console.error("Erreur lors de la récupération des données:", error)
    );
}

function completeProjectCategory(project) {
  const category = availableCategories.find(
    (c) => c.id === parseInt(project.categoryId)
  );
  if (category) {
    project.category = { id: category.id, name: category.name };
  } else {
    // Attribuez une catégorie par défaut si nécessaire
    project.category = { id: null, name: "Non classifié" };
  }
  return project;
}

//******* Fonction principale pour afficher les projets dans les galeries.
function displayProjects(data) {
  // Sélection des conteneurs des galeries dans le DOM par leurs identifiants
  const galleryContainerOriginal = document.getElementById(
    "GalleryContainerOriginal"
  );
  const galleryContainerModal = document.getElementById(
    "GalleryContainerModal"
  );

  // Nettoyage des conteneurs pour s'assurer qu'ils sont vides avant d'ajouter les nouveaux éléments
  galleryContainerOriginal.innerHTML = "";
  galleryContainerModal.innerHTML = "";

  // Boucle sur chaque projet fourni dans les données
  data.forEach((project) => {
    // Création d'un élément pour la galerie originale et ajout au conteneur correspondant
    const figureElementOriginal = createGalleryItem(
      project,
      "gallery-item-original",
      false
    );
    galleryContainerOriginal.appendChild(figureElementOriginal);

    // Création d'un élément pour la galerie modale et ajout au conteneur correspondant
    const figureElementModal = createGalleryItem(
      project,
      "gallery-item-modal",
      true
    );
    galleryContainerModal.appendChild(figureElementModal);
  });
}

//******* Fonction pour créer un élément de galerie (figure) basé sur un projet.
function createGalleryItem(project, className, isModal) {
  // Création d'un élément 'figure' et configuration de ses propriétés
  const figureElement = document.createElement("figure");
  figureElement.className = `${className} project`; // Classe CSS pour styliser l'élément
  figureElement.dataset.category = project.category.name.toLowerCase(); // Catégorie du projet pour éventuels filtres
  figureElement.id = project.id; // Identifiant unique du projet

  // Création et configuration de l'élément 'img' pour l'image du projet
  const imageElement = document.createElement("img");
  imageElement.src = project.imageUrl; // Source de l'image
  imageElement.alt = project.title; // Texte alternatif pour l'accessibilité
  imageElement.title = project.title; // Titre affiché au survol pour l'info-bulle

  // Ajout de l'image au 'figure'
  figureElement.appendChild(imageElement);

  if (isModal) {
    // Pour la galerie modale, ajout d'un bouton qui contiendra l'icône de corbeille pour la suppression
    const button = document.createElement("button");
    button.className = "delete-btn";
    button.setAttribute("type", "button"); // Bonne pratique pour les boutons dans les formulaires

    // Création de l'icône de corbeille et ajout au bouton
    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fa-solid fa-trash-can"; // Classe FontAwesome pour l'icône
    deleteIcon.onclick = function () {
      // console.log(`Supprimer le projet: ${project.id}`);
      deleteProject(project.id);
    };

    // Ajout de l'icône au bouton, puis du bouton à l'élément 'figure'
    button.appendChild(deleteIcon);
    figureElement.appendChild(button);
  } else {
    // Pour la galerie originale, ajout d'une légende avec le titre du projet
    const figcaptionElement = document.createElement("figcaption");
    figcaptionElement.textContent = project.title;
    figureElement.appendChild(figcaptionElement);
  }

  // Retourne l'élément 'figure' complété pour être ajouté au DOM
  return figureElement;
}

//******* Affiche les boutons de filtrage des projets selon les catégories fournies.
function displayFilterButtons(categories) {
  filterContainer.innerHTML = "";

  // Crée et ajoute un bouton pour réinitialiser le filtre et afficher tous les projets.
  filterContainer.appendChild(createFilterButton("all", "Tous"));

  // Pour chaque catégorie, crée un bouton de filtre et l'ajoute au conteneur de filtres.
  categories.forEach((category) => {
    filterContainer.appendChild(
      createFilterButton(category.name.toLowerCase(), category.name)
    );
  });
}

//******* Crée un bouton de filtre.
function createFilterButton(filterId, filterName) {
  // Crée l'élément bouton et définit son texte et sa classe.
  const button = document.createElement("button");
  button.textContent = filterName;
  button.className = "filter-button";

  // Stocke l'identifiant du filtre dans un attribut data- pour une utilisation ultérieure.
  button.dataset.filter = filterId;

  // Ajoute un gestionnaire d'événement de clic qui filtrera les projets quand ce bouton est cliqué.
  button.addEventListener("click", () => filterProjects(filterId));
  return button;
}

//******* Filtre les projets affichés en fonction de l'identifiant de catégorie sélectionné.
function filterProjects(filterId) {
  // Sélectionne tous les éléments figure dans le conteneur de la galerie.
  const allProjects = document.querySelectorAll(
    "#GalleryContainerOriginal figure"
  );

  // Itère sur chaque projet pour déterminer s'il doit être affiché ou masqué.
  allProjects.forEach((project) => {
    // Affiche le projet si son identifiant de catégorie correspond au filtre sélectionné,
    // ou si le filtre sélectionné est "all" pour tout afficher. Sinon, masque le projet.
    project.style.display =
      filterId === "all" || project.dataset.category === filterId ? "" : "none";
  });
}

//******* Configurer et gérer le comportement d'une fenêtre modale dans votre interface utilisateur
function setupModal() {
  // Sélectionne tous les éléments avec la classe .icon et attache un gestionnaire d'événements de clic
  // pour ouvrir la modale identifiée par l'ID "myModal".
  const icons = document.querySelectorAll(".icon");
  icons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const modal = document.getElementById("myModal");
      modal.style.display = "block";
    });
  });

  // Sélectionne le bouton de fermeture original dans la modale et attache un gestionnaire d'événements de clic
  // pour fermer la modale en modifiant son style pour qu'elle ne soit pas affichée.
  const closeModalOriginal = document.querySelector(".modal .close-original");
  closeModalOriginal.addEventListener("click", () => {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
  });

  // Sélectionne le bouton "Ajouter une photo" par son id et attache un gestionnaire d'événements de clic.
  const addPhotoBtn = document.querySelector(".add-img");
  addPhotoBtn.addEventListener("click", () => {
    // Sélectionne la première modal par son identifiant et la cache.
    const firstModal = document.querySelector(".modal-original"); // Assurez-vous que c'est le bon ID
    firstModal.style.display = "none";

    // Sélectionne la seconde modal par son identifiant et l'affiche.
    const secondModal = document.querySelector(".modal-seconde"); // Assurez-vous que c'est le bon ID
    secondModal.style.display = "block";
  });

  // Sélectionne un second bouton de fermeture dans la modale et réalise la même action que le premier
  // bouton de fermeture pour cacher la modale lors du clic.
  const closeModalSeconde = document.querySelector(".modal .close-seconde");
  closeModalSeconde.addEventListener("click", () => {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
  });

  // Sélectionne un bouton pour revenir au contenu original de la modale depuis un second contenu.
  // Si ce bouton existe, attache un gestionnaire d'événements de clic pour changer l'affichage
  // entre le contenu original et le second contenu de la modale.
  const backSecond = document.querySelector(".back-seconde");
  if (backSecond) {
    backSecond.addEventListener("click", () => {
      const originalContent = document.querySelector(".modal-original");
      const secondContent = document.querySelector(".modal-seconde");

      // Assure que les deux contenus existent avant de tenter de modifier leur affichage.
      if (originalContent && secondContent) {
        secondContent.style.display = "none"; // Cache le second contenu
        originalContent.style.display = "block"; // Montre le contenu original
      }
    });
  }

  // Lance une requête à l'API pour récupérer les catégories.
  fetch(baseURL + `categories`)
    // Attend la réponse de la requête fetch précédente
    .then((response) => {
      // Vérifie si le statut de la réponse n'est pas un succès (e.g., erreur 404, 500)
      if (!response.ok) {
        // Lance une erreur qui interrompt l'exécution du code suivant et passe directement au bloc catch
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Si la réponse est un succès, convertit la réponse en JSON
      return response.json();
    })
    // Traite les données JSON une fois qu'elles sont reçues et converties
    .then((data) => {
      // Sélectionne l'élément select HTML par son ID 'categorie'
      const select = document.querySelector("#categorie");
      // Réinitialise le contenu de l'élément select pour s'assurer qu'il est vide
      select.innerHTML = "";

      // Crée une option par défaut qui sera affichée en premier dans le select
      let defaultOption = document.createElement("option");
      defaultOption.textContent = ""; // Définit le texte de l'option par défaut (ici vide)
      defaultOption.value = ""; // Définit la valeur envoyée si cette option est sélectionnée (ici vide)
      defaultOption.disabled = true; // Rend l'option non-sélectionnable
      defaultOption.selected = true; // Définit cette option comme étant sélectionnée par défaut au chargement de la page
      // Ajoute l'option par défaut au début du select
      select.appendChild(defaultOption);

      // Itère sur chaque catégorie reçue dans les données JSON
      data.forEach((categorie) => {
        // Crée un nouvel élément option pour chaque catégorie
        let option = document.createElement("option");
        option.value = categorie.id; // Définit l'ID de la catégorie comme valeur de l'option
        option.textContent = categorie.name; // Utilise le nom de la catégorie comme texte visible dans l'option
        // Ajoute l'option au select
        select.appendChild(option);
      });
    })
    // En cas d'erreur à n'importe quelle étape ci-dessus, le code dans `.catch()` est exécuté.
    .catch((error) => {
      // Affiche l'erreur dans la console du navigateur.
      console.error("Could not load categories:", error);
    });

  // Écouteur d'événement sur selectImage pour déclencher la sélection de fichier
  selectImage.addEventListener("click", function () {
    inputFile.click();
  });

  // Fonction pour gérer le chargement et l'affichage de l'image sélectionnée
  function handleFileChange() {
    // Récupère le premier fichier sélectionné par l'utilisateur
    const image = inputFile.files[0];

    // Vérifie si un fichier a été sélectionné
    if (image) {
      // Crée un nouvel objet FileReader pour lire le contenu du fichier
      const reader = new FileReader();

      // Définit ce qui doit se passer une fois que le fichier est lu
      reader.onload = () => {
        // Recherche une image existante dans imgArea et la supprime si elle existe
        // Cela assure que seulement une image est affichée à la fois
        const existingImg = imgArea.querySelector("img");
        if (existingImg) {
          imgArea.removeChild(existingImg);
        }

        // Crée une nouvelle balise <img> et définit son URL source avec le résultat de FileReader
        const imgUrl = reader.result;
        const img = document.createElement("img");
        img.src = imgUrl;

        // Ajoute une classe à l'image pour identification facile et application de styles CSS
        img.classList.add("changeable-image");

        // Ajoute l'image nouvellement créée au conteneur imgArea pour l'afficher sur la page
        imgArea.appendChild(img);
      };

      // Commence la lecture du fichier sélectionné et convertit le fichier en Data URL
      // Une Data URL est une chaîne de caractères qui représente le fichier, permettant son affichage comme source d'image
      reader.readAsDataURL(image);
    }
  }

  // Ajoute un écouteur d'événement sur inputFile pour détecter quand un utilisateur sélectionne un fichier
  inputFile.addEventListener("change", handleFileChange);

  // Ajoute un écouteur d'événements sur imgArea pour gérer les clics sur les images à l'intérieur
  // Cela permet de redéclencher la sélection de fichier quand l'utilisateur clique sur l'image affichée
  imgArea.addEventListener("click", function (event) {
    // Vérifie si l'élément cliqué a la classe "changeable-image"
    if (event.target.classList.contains("changeable-image")) {
      // Si oui, cela signifie que l'utilisateur a cliqué sur l'image
      // Déclenche alors un clic sur inputFile pour ouvrir la boîte de dialogue de sélection de fichier
      inputFile.click();
    }
  });
}

//*************************************************************************************************************************/
// Configuration des écouteurs d'événements
function setupProjectSubmission() {
  document
    .querySelector(".valide")
    .addEventListener("click", handleProjectSubmission);
}

// Gestion de la soumission du projet
function handleProjectSubmission() {
  const fileInput = document.querySelector('input[type="file"]');
  const file = fileInput ? fileInput.files[0] : null;
  const title = document.querySelector("#titre").value;
  const category = document.querySelector("#categorie").value;

  console.log(category);

  // Log des données avant l'envoi de la requête
  console.log("Données du projet :");
  console.log("Image :", file);
  console.log("Titre :", title);
  console.log("Catégorie ID :", category);

  // Validation des données et envoi de la requête POST
  if (!validateFormData(file, title, category)) {
    return;
  }

  const formData = buildFormData(file, title, category);
  submitFormData(formData);
}

// Fonction pour envoyer la requête POST avec FormData
function submitFormData(formData) {
  fetch(baseURL + "works", {
    method: "POST",
    body: formData,
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Projet ajouté avec succès:", data);
      if (
        data &&
        data.id &&
        data.imageUrl &&
        data.title &&
        data.categoryId // Vérifiez l'existence de categoryId au lieu de category.name
      ) {
        // Puisque l'objet category n'est pas inclus, complétez-le si nécessaire
        const completedProject = completeProjectCategory(data); // Assurez-vous que cette fonction est définie et disponible
        addToGalleries(completedProject); // Ajoutez le projet complété aux galeries
      } else {
        console.error("Données du projet incomplètes", data);
      }
    })
    .catch((error) => {
      console.error("Erreur lors de l'ajout du projet:", error);
    });
}

// Fonction pour valider les données du formulaire
function validateFormData(file, title, categoryId) {
  if (!file || !title.trim() || !categoryId) {
    alert("Tous les champs sont requis (image, titre, catégorie).");
    return false;
  }

  const MAX_SIZE_ALLOWED = 4 * 1024 * 1024; // 4MB en octets
  if (file.size > MAX_SIZE_ALLOWED) {
    alert("La taille de l'image dépasse la limite autorisée de 4MB.");
    return false;
  }

  return true;
}

// Fonction pour construire l'objet FormData
function buildFormData(file, title, category) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", title);
  formData.append("category", category);
  return formData;
}

// Fonction pour ajouter le projet aux galeries
function addToGalleries(project) {
  // Appelle createGalleryItem pour le nouveau projet avec le paramètre pour la galerie originale
  const figureElementOriginal = createGalleryItem(
    project,
    "gallery-item-original",
    false
  );
  // Ajoute l'élément créé à la galerie originale
  document
    .getElementById("GalleryContainerOriginal")
    .appendChild(figureElementOriginal);

  // Appelle createGalleryItem pour le nouveau projet avec le paramètre pour la galerie modale
  const figureElementModal = createGalleryItem(
    project,
    "gallery-item-modal",
    true
  );
  // Ajoute l'élément créé à la galerie modale
  document
    .getElementById("GalleryContainerModal")
    .appendChild(figureElementModal);

  // Optionnel: Fermer la modale d'ajout et/ou réinitialiser le formulaire
  closeModalAndResetForm();
}

// Fonction pour fermer la modale et réinitialiser le formulaire
function closeModalAndResetForm() {
  // Ferme la modale, si vous avez un identifiant spécifique pour la modale d'ajout, utilisez-le ici
  const modal = document.getElementById("myModal"); // Assurez-vous que c'est le bon ID
  modal.style.display = "none";

  // Réinitialiser le formulaire d'ajout de projet, suppose que vous avez un formulaire avec un identifiant spécifique
  const form = document.querySelector("form"); // Utilisez le bon sélecteur pour votre formulaire
  form.reset();

  // Réinitialise également l'aperçu de l'image si vous avez une section d'aperçu d'image
  const imgPreview = document.querySelector(".img-area img"); // Assurez-vous que c'est le bon sélecteur
  if (imgPreview) {
    imgPreview.src = ""; // Ou définissez-le sur une image par défaut
  }

  // Si vous gérez l'état de chargement (comme un spinner), assurez-vous de le désactiver ici
}
//*************************************************************************************************************************/

//******* Définition de la fonction deleteProject, qui prend en argument l'ID du projet à supprimer.
function deleteProject(projectId) {
  const token = localStorage.getItem("token");

  fetch(`http://localhost:5678/api/works/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then(response => {
    if (!response.ok) {
      // Affichage plus détaillé basé sur le statut de la réponse
      response.json().then(errorDetails => {
        console.error("Détails de l'erreur :", errorDetails);
        // Ici, vous pourriez ajuster votre traitement d'erreur en fonction de `errorDetails`
      });
      throw new Error(`La suppression du projet a échoué avec le statut : ${response.status}`);
    }
    // Optionnel: si vous vous attendez à un corps de réponse même en cas de succès
    return response.json();
  })
  .then(data => {
    // Traitement en cas de succès, si nécessaire
    console.log("Projet supprimé avec succès", data);
    removeProjectFromDOM(projectId);
  })
  .catch(error => {
    console.error("Erreur lors de la suppression du projet:", error);
  });
}


//******* Fonction pour supprimer un projet du DOM en utilisant son ID de projet.
function removeProjectFromDOM(projectId) {
  // Sélectionne tous les éléments dans le DOM qui ont une classe `.project` et un attribut `data-id` correspondant à l'ID du projet passé en argument.
  document
    .querySelectorAll(`.project[data-id="${projectId}"]`)
    .forEach((project) => {
      // Pour chaque élément de projet trouvé, utilise la méthode `.remove()`
      // pour le supprimer du DOM. Cela retire effectivement l'élément de la page,
      // rendant la suppression du projet visuellement immédiate pour l'utilisateur.
      project.remove();
    });
}

//******* Attache un écouteur d'événements de clic aux conteneurs spécifiés. Cela permet de capturer
//******* les clics sur les boutons de suppression sans avoir besoin d'attacher des écouteurs d'événements individuellement à chaque bouton.
document
  .querySelectorAll("#GalleryContainerModal, #GalleryContainerOriginal")
  .forEach((container) => {
    container.addEventListener("click", function (event) {
      // Utilise event.target pour trouver le bouton de suppression le plus proche du clic.
      // Si un tel bouton est trouvé, cela signifie que l'utilisateur a cliqué sur un bouton de suppression.
      const deleteBtn = event.target.closest(".delete-btn");
      if (deleteBtn) {
        // Vérifie si le clic était sur un bouton de suppression.
        // Trouve l'élément du projet le plus proche à partir du bouton de suppression.
        // Cela permet de s'assurer que l'action de suppression est liée à l'élément correct.
        const projectElement = deleteBtn.closest(".gallery-item-modal");
        if (projectElement && projectElement.id) {
          // Vérifie si l'élément du projet et son ID existent.
          // Appelle la fonction deleteProject avec l'ID de l'élément du projet pour effectuer la suppression.
          deleteProject(projectElement.id);
        } else {
          // Affiche un message d'erreur si l'élément du projet ciblé n'a pas d'ID valide.
          console.error(
            "Impossible de trouver l'élément projet avec un ID valide."
          );
        }
      }
    });
  });
