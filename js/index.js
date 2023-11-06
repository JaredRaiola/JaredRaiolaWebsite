const sections = document.querySelectorAll('.content > div');

document.querySelectorAll('.navlinks a').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        sections.forEach((section) => {
            section.style.display = 'none';
        });
        const sectionId = link.getAttribute('href').substring(1);
        document.querySelector(`#${sectionId}`).style.display = 'block';
    });
});

const words = ["developer...", "designer...", "dog dad..."];
const heroSubtitle = document.getElementById("hero-subtitle");
const cursorElement = document.getElementById("cursor");

function subtitleGenerator() {
    let index = 0;
    let isDeleting = false;
    let count = 0;
    let cursorVisible = true;

    function toggleCursor() {
        cursorVisible = !cursorVisible;
        cursorElement.style.visibility = cursorVisible ? "visible" : "hidden";
    }

    function type() {
        cursorElement.style.visibility = "visible";
        let word = words[count];
        if (index < word.length && !isDeleting) {
            heroSubtitle.textContent += word.charAt(index);
            index++;
        } else if (index > 0) {
            if (!isDeleting && index === word.length) {
                toggleCursor();
                setTimeout(() => {
                    isDeleting = true;
                }, 2000);
            } else {
                heroSubtitle.textContent = heroSubtitle.textContent.slice(0, -1);
                index--;
            }
        } else {
            isDeleting = false;
            count++;
            console.log("here " + count)
            if (count >= words.length) {
                count = 0;
            }
        }
        setTimeout(type, 200);
    }
    type();
}

subtitleGenerator();
