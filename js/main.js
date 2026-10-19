// Langue et textes dynamiques
var LANG=document.documentElement.lang==="mg"?"mg":"fr";
var T={fr:{show:"💰 Voir le détail de la grille tarifaire",hide:"💰 Masquer la grille tarifaire",empty:"Aucune actualité pour le moment.",more:"Lire la suite",total:"Total annuel",illus:"Illustration",soon:"Informations à venir : contactez le secrétariat.",callsite:"Contacter ce site",info:"Plus d'informations",close:"Fermer",fixed:"de frais communs",from:"dès",year:"an",months:["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]},
mg:{show:"💰 Hijery ny antsipirian'ny saram-pianarana",hide:"💰 Afeno ny lisitry ny saram-pianarana",empty:"Tsy mbola misy vaovao amin'izao fotoana izao.",more:"Hamaky bebe kokoa",total:"Totalin'ny taona",illus:"Sary ohatra",soon:"Mbola ho avy ny fanazavana : mifandraisa amin'ny sekretaria.",callsite:"Hifandray amin'ity toerana ity",info:"Fanazavana fanampiny",close:"Akatony",fixed:"sarany iraisana",from:"manomboka amin'ny",year:"taona",months:["Janoary","Febroary","Martsa","Aprily","Mey","Jona","Jolay","Aogositra","Septambra","Oktobra","Novambra","Desambra"]}}[LANG];

document.getElementById('y').textContent=new Date().getFullYear();
// Formulaire : ouvre le client mail (remplacer l'adresse)
document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();var d=new FormData(this);
location.href='mailto:benjaiba@yahoo.fr?subject='+encodeURIComponent('Contact site IUTAM – '+d.get('n'))+'&body='+encodeURIComponent(d.get('m')+'\n\n'+d.get('e'));});
// Apparition au scroll
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
// Cartes inclinées en 3D
var fine=matchMedia('(hover:hover)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
if(fine)document.querySelectorAll('.card').forEach(function(c){
c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='rotateY('+x*12+'deg) rotateX('+-y*12+'deg)'});
c.addEventListener('mouseleave',function(){c.style.transform=''})});
// Thème clair/sombre
(function(){var r=document.documentElement,b=document.getElementById('th');
function cur(){return r.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}
function icon(){b.textContent=cur()==='dark'?'☀️':'🌙'}
try{var sv=localStorage.getItem('theme');if(sv)r.setAttribute('data-theme',sv)}catch(e){}
icon();
b.addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('theme',n)}catch(e){}icon()});
})();
// Animations au défilement
(function(){
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
var V=['a-f','a-z','a-l','a-r'];
document.querySelectorAll('.grid,.pc').forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){if(c.classList.contains('rv')){c.classList.add(V[i%4]);c.style.transitionDelay=(i*90)+'ms'}})});
document.querySelectorAll('.steps').forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){c.classList.add(i%2?'a-r':'a-l');c.style.transitionDelay=(i*120)+'ms'})});
document.querySelectorAll('.tw tr,.tl div,.stats div').forEach(function(el){var i=Array.prototype.indexOf.call(el.parentNode.children,el);el.style.setProperty('--i',i)});
document.querySelectorAll('.rv').forEach(function(el){el.addEventListener('transitionend',function(e){if(e.propertyName==='transform'&&el.classList.contains('in')){el.classList.add('done');el.style.transitionDelay=''}})});
// compteurs
var cio=new IntersectionObserver(function(es){es.forEach(function(x){if(!x.isIntersecting)return;cio.unobserve(x.target);
x.target.querySelectorAll('b').forEach(function(b){var m=b.textContent.match(/^(~?)(\d+)(.*)$/);if(!m||reduce)return;var n=+m[2],t0=performance.now();
(function f(t){var k=Math.min((t-t0)/1500,1);b.textContent=m[1]+Math.round(n*(1-Math.pow(1-k,3)))+m[3];if(k<1)requestAnimationFrame(f)})(t0)})})},{threshold:.4});
document.querySelectorAll('.stats').forEach(function(el){cio.observe(el)});
// barre de progression + parallaxe
var pg=document.getElementById('pg'),hc=document.querySelector('.hc'),hero=document.getElementById('hero'),tk=false;
function onS(){tk=false;var y=scrollY,h=document.documentElement.scrollHeight-innerHeight;pg.style.transform='scaleX('+(h>0?y/h:0)+')';
if(!reduce&&y<hero.offsetHeight){hc.style.transform='translateY('+(y*.14)+'px)';hc.style.opacity=Math.max(1-y/(hero.offsetHeight*.9),0)}}
addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(onS)}},{passive:true});onS();
})();
// Grille tarifaire dépliable
(function(){var b=document.getElementById('fb'),p=document.getElementById('fp');
b.addEventListener('click',function(){var o=p.classList.toggle('open');b.setAttribute('aria-expanded',o);
b.querySelector('span').textContent=o?T.hide:T.show})})();
// Photos en collage
(function(){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);setTimeout(function(){x.target.classList.add('ok')},2200)}})},{threshold:.2});
document.querySelectorAll('.col').forEach(function(c){io.observe(c)})})();
// Logo 3D animé
(function(){
var img=document.getElementById('lg'),cv=document.getElementById('c'),st=document.getElementById('stage');
try{
if(!window.THREE)return;
var R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));
var S=new THREE.Scene(),C=new THREE.PerspectiveCamera(40,1,.1,100);C.position.z=7;
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
var G=new THREE.Group();S.add(G);
var tex=new THREE.TextureLoader().load(img.src,function(){img.style.visibility='hidden'});
tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
var U={map:{value:tex},t:{value:0}};
var mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:'uniform sampler2D map;uniform float t;varying vec2 v;void main(){vec2 u=(v-.5)*1.16+.5;vec4 c=texture2D(map,u);float d=abs((v.x+v.y)*.5-(fract(t*.22)*1.8-.4));float b=smoothstep(.09,0.,d);c.rgb+=b*.45;gl_FragColor=vec4(c.rgb,1.);}',side:THREE.FrontSide});
var geo=new THREE.CircleGeometry(2,96);
var front=new THREE.Mesh(geo,mat),back=new THREE.Mesh(geo,mat);back.rotation.y=Math.PI;back.position.z=-.001;
var rim=new THREE.Mesh(new THREE.TorusGeometry(2.03,.05,24,120),new THREE.MeshBasicMaterial({color:0xe0a526}));
G.add(front,back,rim);
var N=110,p=new Float32Array(N*3);for(var i=0;i<N;i++){p[i*3]=(Math.random()-.5)*7;p[i*3+1]=(Math.random()-.5)*7;p[i*3+2]=-.5-Math.random()*3}
var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(p,3));
var pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xf0b93a,size:.035,transparent:true,opacity:.7}));S.add(pts);
var mx=0,my=0,vis=true,t0=performance.now(),spin=0,spinT=-9;
st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
addEventListener('pointermove',function(e){if(e.target!==cv){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5}});
cv.addEventListener('click',function(){if(!reduce)spinT=(performance.now()-t0)/1000});
function rs(){var w=st.clientWidth;R.setSize(w,w,false)}rs();addEventListener('resize',rs);
new IntersectionObserver(function(a){vis=a[0].isIntersecting}).observe(st);
function ease(x){return 1-Math.pow(1-x,3)}
function loop(){requestAnimationFrame(loop);if(!vis)return;
var t=(performance.now()-t0)/1000;U.t.value=t;
if(!reduce&&t>3.5&&t-spinT>9)spinT=t;
var k=reduce?1:Math.min(t/2.6,1),e=ease(k);
var sp=Math.min(Math.max((t-spinT)/1.4,0),1);if(sp>=1)sp=0;
var flip=spinT>0&&(t-spinT)<1.4?ease(sp)*Math.PI*2:0;
G.scale.setScalar(.25+.75*e);
G.rotation.y=(1-e)*Math.PI*5+flip+(mx*.7-0)*.6+(reduce?0:scrollY*.006);
G.rotation.x=my*.5;
G.position.y=reduce?0:Math.sin(t*1.4)*.12;
if(!reduce){pts.rotation.y=t*.08}
pts.material.opacity=.55+.3*Math.sin(t*2);
R.render(S,C)}
loop();
}catch(e){console.warn('3D indisponible',e)}
})();

// Données dynamiques : actualités et frais (fichiers du dossier data/, modifiables sans toucher au code)
(function(){
var root=document.documentElement.dataset.root||"";
function get(u){return fetch(root+u,{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error(u);return r.json()})}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function safe(u){return /^(https?:\/\/|\/(?!\/))/i.test(u||"")?u:""}
function pick(o,k){return (LANG==="mg"&&o[k+"_mg"])||o[k]||""}
function money(n){return String(Math.round(+n||0)).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" Ar"}
function fd(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||"");return m?(+m[3])+" "+T.months[+m[2]-1]+" "+m[1]:""}
var A=document.getElementById("actus-list");
if(A)get("data/actualites.json").then(function(d){
var it=(d.items||[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
if(!it.length){A.innerHTML='<p class="empty">'+esc(T.empty)+"</p>";return}
A.innerHTML=it.map(function(x,i){
var img=x.image?(/^https?:/i.test(x.image)?x.image:root+String(x.image).replace(/^\//,"")):"";
var lk=safe(x.lien);
return '<article class="card nw" style="--i:'+i+'">'+(img?'<img class="ni" src="'+esc(img)+'" alt="" loading="lazy">':"")+
(x.date?'<span class="nd">'+esc(fd(x.date))+"</span>":"")+"<h3>"+esc(pick(x,"titre"))+"</h3><p>"+esc(pick(x,"resume"))+"</p>"+
(lk?'<a class="more" href="'+esc(lk)+'" target="_blank" rel="noopener">'+esc(T.more)+" →</a>":"")+"</article>"}).join("")
}).catch(function(){A.innerHTML='<p class="empty">'+esc(T.empty)+"</p>"});
var SEC="+261320558006",SL=document.getElementById("sites-list");
function imgsrc(p){return /^(https?:|data:)/i.test(p)?p:root+String(p).replace(/^\//,"")}
if(SL)get("data/sites.json").then(function(d){
var L=(d.sites||[]).filter(function(s){return !s.masquer_liste});
SL.innerHTML=L.map(function(s,i){
var img=s.image?imgsrc(s.image):"",lk=safe(s.lien),info=[],
tels=String(s.telephone||"").split("/").map(function(x){return{t:x.replace(/[^+0-9]/g,""),d:x.trim()}}).filter(function(x){return x.t}),
mail=/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(s.email||"")?s.email:"";
if(s.adresse)info.push("<li>📍 "+esc(pick(s,"adresse"))+"</li>");
if(tels.length)info.push("<li>📞 "+tels.map(function(x){return '<a href="tel:'+x.t+'">'+esc(x.d)+"</a>"}).join(" · ")+"</li>");
if(mail)info.push('<li>✉️ <a href="mailto:'+esc(mail)+'">'+esc(mail)+"</a></li>");
if(s.parcours)info.push("<li>🎓 "+esc(pick(s,"parcours"))+"</li>");
var ph=(s.photos||[]).map(function(p){var u=imgsrc(p.src),al=esc(pick(p,"alt"));return '<a class="lb" href="'+esc(u)+'" data-alt="'+al+'"><img src="'+esc(u)+'" alt="'+al+'" loading="lazy"></a>'}).join("");
return '<article class="card nw site" style="--i:'+i+'">'+(img?'<div class="cv"><img class="ni" src="'+esc(img)+'" alt="" loading="lazy">'+(s.illustration?'<span class="ill">'+esc(T.illus)+"</span>":"")+"</div>":'<span class="ic">📍</span>')+
"<h3>"+esc(s.nom)+"</h3>"+(s.role?'<span class="chip">'+esc(pick(s,"role"))+"</span>":"")+
(info.length?'<ul class="sl">'+info.join("")+"</ul>":"")+(s.note?'<p class="soon">'+esc(pick(s,"note"))+"</p>":(info.length?"":'<p class="soon">'+esc(T.soon)+"</p>"))+
(ph?'<div class="gph">'+ph+"</div>":"")+
'<a class="more" href="tel:'+((tels[0]&&tels[0].t)||SEC)+'">'+esc(T.callsite)+" →</a>"+(lk?'<a class="more" href="'+esc(lk)+'" target="_blank" rel="noopener">'+esc(T.info)+" →</a>":"")+"</article>"}).join("")
}).catch(function(){});
var B=document.getElementById("frais-body");
if(B)get("data/frais.json").then(function(d){
var C=d.communs||[],Tr=d.tranches||[],N=d.niveaux||[];if(!N.length)return;
var fixed=0;C.forEach(function(l){fixed+=+l.montant||0});
function total(n){return fixed+(+n.tranche||0)*Tr.length}
function row(i,a,v,lv){return "<tr"+(lv?' class="lv"':"")+' style="--i:'+i+'"><td>'+esc(a)+"</td><td"+(lv?' class="flash"':"")+">"+money(v)+"</td></tr>"}
var tabs=document.getElementById("frais-tabs"),note=document.getElementById("frais-note"),sum=document.getElementById("frais-sum"),head=document.getElementById("frais-total");
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
function count(el,to){if(RM){el.textContent=money(to);return}var t0=performance.now();(function f(t){var k=Math.min((t-t0)/700,1);el.textContent=money(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)}
function show(i,user){var n=N[i],k=0,rows=[];
C.forEach(function(l){k++;rows.push(row(k,pick(l,"designation"),l.montant,false))});
Tr.forEach(function(l){k++;rows.push(row(k,pick(l,"designation"),n.tranche,true))});
B.innerHTML=rows.join("")+'<tr class="t" style="--i:'+(k+1)+'"><td>'+esc(T.total)+" ("+esc(pick(n,"nom"))+")</td><td>"+money(total(n))+"</td></tr>";
if(note)note.textContent=pick(n,"detail");
if(sum){sum.innerHTML='<span class="fl">'+esc(T.total)+" · "+esc(pick(n,"nom"))+'</span><b class="fn"></b><span class="fd">'+Tr.length+" × "+money(n.tranche)+" + "+money(fixed)+" "+esc(T.fixed)+"</span>";count(sum.querySelector(".fn"),total(n))}
if(user&&head)head.textContent=pick(n,"nom")+" : "+money(total(n))+" / "+T.year;
if(tabs)Array.prototype.forEach.call(tabs.children,function(b,j){b.setAttribute("aria-selected",j===i?"true":"false");b.classList.toggle("on",j===i)})}
if(tabs){tabs.innerHTML=N.map(function(n){return '<button type="button" role="tab" class="tab" aria-selected="false">'+esc(pick(n,"nom"))+"</button>"}).join("");
Array.prototype.forEach.call(tabs.children,function(b,j){b.addEventListener("click",function(){show(j,true)})})}
show(0,false);
if(head)head.textContent=T.from+" "+money(Math.min.apply(null,N.map(total)))+" / "+T.year;
}).catch(function(){});
})();

// Navigation : section active et menu mobile
(function(){
var h=document.querySelector("header"),b=document.getElementById("bg"),L=[].slice.call(document.querySelectorAll("#nav a[href^='#']"));
function close(){h.classList.remove("open");if(b){b.setAttribute("aria-expanded","false");b.textContent="☰"}}
if(b)b.addEventListener("click",function(){var o=h.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false");b.textContent=o?"✕":"☰"});
L.forEach(function(a){a.addEventListener("click",close)});
if(!("IntersectionObserver" in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)L.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id)})})},{rootMargin:"-45% 0px -50% 0px"});
L.forEach(function(a){var s=document.querySelector(a.getAttribute("href"));if(s)io.observe(s)});
})();

// Mentions légales : s'ouvrent dans une fenêtre depuis le pied de page (la page mentions-legales.html reste disponible sans JavaScript)
(function(){
var a=document.querySelector('footer a[href$="mentions-legales.html"]');if(!a||!window.fetch)return;
var m=document.createElement("div");m.className="mm";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
m.innerHTML='<div class="mm-box"><button class="mm-x" type="button" aria-label="'+T.close+'">✕</button><div class="legal"></div></div>';
document.body.appendChild(m);
var box=m.querySelector(".mm-box"),body=m.querySelector(".legal"),x=m.querySelector(".mm-x"),loaded=false;
function close(){m.hidden=true;document.body.style.overflow="";a.focus()}
function open(){m.hidden=false;document.body.style.overflow="hidden";box.scrollTop=0;x.focus()}
a.addEventListener("click",function(e){e.preventDefault();if(loaded){open();return}
fetch(a.href).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){
var s=new DOMParser().parseFromString(t,"text/html").querySelector("main.legal");if(!s)throw 0;
var b=s.querySelector(".back");if(b)b.remove();body.innerHTML=s.innerHTML;loaded=true;open()
}).catch(function(){location.href=a.href})});
x.addEventListener("click",close);
m.addEventListener("click",function(e){if(e.target===m)close()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!m.hidden)close()});
})();

// Panneau des parcours : défilement automatique, flèches, onglets, balayage, clavier
(function(){
var root=document.getElementById("pubs");if(!root)return;
var S=[].slice.call(root.querySelectorAll(".ps")),Tb=[].slice.call(document.querySelectorAll(".pt")),bar=root.querySelector(".pubs-bar i"),
cnt=root.querySelector(".pubs-cnt"),pp=root.querySelector(".pubs-pp"),
RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches,DUR=6500,i=0,tm=null,playing=!RM,inView=false,hold=false;
function two(n){return("0"+n).slice(-2)}
function run(){return playing&&inView&&!hold&&!document.hidden}
function restart(){clearTimeout(tm);if(bar){bar.style.animation="none";void bar.offsetWidth;if(run())bar.style.animation="pubbar "+DUR+"ms linear forwards"}
if(run())tm=setTimeout(function(){go(i+1)},DUR)}
function go(n,user){i=(n+S.length)%S.length;
S.forEach(function(s,k){s.classList.toggle("on",k===i);s.setAttribute("aria-hidden",k===i?"false":"true")});
Tb.forEach(function(t,k){t.classList.toggle("on",k===i);if(k===i)t.setAttribute("aria-current","true");else t.removeAttribute("aria-current")});
if(cnt)cnt.textContent=two(i+1)+" / "+two(S.length);
var c=Tb[i];if(c&&c.parentNode&&c.parentNode.scrollTo)c.parentNode.scrollTo({left:c.offsetLeft-c.parentNode.clientWidth/2+c.offsetWidth/2,behavior:"smooth"});
root.setAttribute("aria-live",playing?"off":"polite");restart()}
function setPlay(p){playing=p;if(pp){pp.textContent=p?"⏸":"▶";pp.setAttribute("aria-label",p?pp.dataset.pause:pp.dataset.play)}root.setAttribute("aria-live",p?"off":"polite");restart()}
root.querySelector(".pubs-prev").addEventListener("click",function(){go(i-1,true)});
root.querySelector(".pubs-next").addEventListener("click",function(){go(i+1,true)});
if(pp)pp.addEventListener("click",function(){setPlay(!playing)});
Tb.forEach(function(t,k){t.addEventListener("click",function(){go(k,true)})});
root.addEventListener("mouseenter",function(){hold=true;restart()});
root.addEventListener("mouseleave",function(){hold=false;restart()});
root.addEventListener("focusin",function(){hold=true;restart()});
root.addEventListener("focusout",function(){hold=false;restart()});
root.addEventListener("keydown",function(e){if(e.key==="ArrowLeft"){go(i-1,true)}else if(e.key==="ArrowRight"){go(i+1,true)}});
var x0=null;
root.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;hold=true;restart()},{passive:true});
root.addEventListener("touchend",function(e){if(x0!==null){var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>45)go(i+(dx<0?1:-1),true)}x0=null;setTimeout(function(){hold=false;restart()},3500)},{passive:true});
document.addEventListener("visibilitychange",restart);
if("IntersectionObserver" in window){new IntersectionObserver(function(es){inView=es[0].isIntersecting;restart()},{threshold:.35}).observe(root)}else{inView=true}
if(pp&&RM){pp.textContent="▶";pp.setAttribute("aria-label",pp.dataset.play)}
go(0);
})();

// Photos et affiche : s'ouvrent dans une fenêtre (sans JavaScript, le lien ouvre l'image seule)
(function(){
var m=document.createElement("div");m.className="mm";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
m.innerHTML='<div class="mm-box mm-img"><button class="mm-x" type="button" aria-label="'+T.close+'">✕</button><img alt=""></div>';
document.body.appendChild(m);
var img=m.querySelector("img"),x=m.querySelector(".mm-x"),from=null;
function close(){m.hidden=true;document.body.style.overflow="";if(from)from.focus()}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a.lb");if(!a)return;e.preventDefault();from=a;img.src=a.href;img.alt=a.dataset.alt||"";m.hidden=false;document.body.style.overflow="hidden";x.focus()});
x.addEventListener("click",close);
m.addEventListener("click",function(e){if(e.target===m)close()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!m.hidden)close()});
})();
