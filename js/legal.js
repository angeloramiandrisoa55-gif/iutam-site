// Thème clair/sombre et année pour les pages légales
(function(){var r=document.documentElement,b=document.getElementById('th');
function cur(){return r.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}
function icon(){b.textContent=cur()==='dark'?'☀️':'🌙'}
try{var sv=localStorage.getItem('theme');if(sv)r.setAttribute('data-theme',sv)}catch(e){}
icon();
b.addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('theme',n)}catch(e){}icon()});
document.getElementById('y').textContent=new Date().getFullYear();
})();
