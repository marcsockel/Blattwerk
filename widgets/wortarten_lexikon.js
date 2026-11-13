// Wortarten-Erkennung (für widgets/grammatik.js → Wortarten)
// Erkennt Nomen, Verben und Adjektive in deutschen Grundschultexten — ohne Internet, mit
// eigenen Wortlisten (Grundwortschatz) und ein paar Regeln. Das Ergebnis ist ein VORSCHLAG,
// den die Lehrkraft im Widget durch Anklicken korrigiert.
//   wartLexErkenne(woerter)  → je Wort '' | 'N' | 'V' | 'A'   (woerter: [{wort, satzanfang, ende}])
//   wartLexGrundform(wort, tag) → Grundform (laufen, klein) oder null, wenn unbekannt
// Aufbau: Verbformen und Adjektivformen werden beim Laden aus den Listen erzeugt
// (Form → Grundform). Nomen erkennt die Großschreibung; am Satzanfang hilft die Liste
// der Funktionswörter (Artikel, Pronomen, Präpositionen, Adverbien …).

(function () {
  const W = s => s.trim().split(/\s+/);

  // ── Schwache (regelmäßige) Verben. „-" trennt eine untrennbare Vorsilbe ab (Partizip ohne ge-).
  const SCHWACH = W(`
    machen spielen lernen malen kaufen holen suchen zeigen sagen fragen hören lachen weinen kochen bauen
    brauchen danken glauben hoffen leben lieben wohnen arbeiten antworten warten baden reden kosten rechnen
    zeichnen öffnen regnen schneien atmen tanzen putzen setzen stellen legen füllen fühlen führen folgen
    feiern wandern klettern sammeln basteln klingeln lächeln schütteln wechseln zaubern flüstern füttern
    ändern er-innern klären zählen zahlen er-lauben merken be-obachten be-wegen grüßen stecken dienen
    ver-letzen ver-missen decken ent-schuldigen stören telefonieren probieren passieren reparieren
    fotografieren spazieren gratulieren interessieren trainieren sortieren markieren notieren kontrollieren
    funktionieren duschen wischen mischen naschen rutschen klatschen lauschen tauschen wünschen schmecken
    schicken drücken pflücken packen wecken gucken schauen kauen bellen miauen summen brummen quaken krähen
    zwitschern hüpfen klopfen kämpfen schimpfen tropfen stopfen zupfen kleben schweben üben loben toben
    teilen heilen eilen wählen fehlen kühlen spülen wühlen spüren lehren kehren wehren nähen mähen säen
    drehen wehen blühen glühen ruhen freuen trauen klauen rollen knallen fällen schnallen zielen kitzeln
    kuscheln rascheln wackeln bügeln segeln regeln angeln murmeln stolpern zittern kichern flattern plappern
    klappern knabbern schnuppern wundern plaudern rudern pflanzen ernten landen enden melden bilden kleiden
    schaden starten testen husten niesen reisen kreisen lösen rasen grasen fassen hassen passen küssen
    nutzen schützen stützen schwitzen kratzen platzen schmatzen heizen reizen glänzen kürzen stürzen würzen
    parken wirken stärken schenken lenken winken hinken tanken turnen warnen reinigen neigen jagen wagen
    nagen klagen fegen pflegen siegen sorgen borgen saugen lohnen schonen ahnen mahnen gähnen dehnen lehnen
    kämmen stimmen träumen räumen schäumen schämen formen wärmen stürmen lärmen filmen schaffen taufen
    prüfen strafen hoppeln humpeln trampeln pinseln radeln rodeln paddeln trödeln grübeln jubeln zappeln
    tippen kippen wippen schnappen klappen stoppen hupen pumpen wetten retten schütten hüten brüten bluten
    läuten deuten leiten bereiten be-gleiten achten be-trachten wachen krachen pochen fluchen buchen rauchen
    tauchen reichen begegnen segnen trocknen ordnen leugnen kriegen tragen-x hängen stellen spielen
    ver-stecken wohnen kleben zeigen lutschen quietschen plantschen planschen matschen patschen fauchen
    schnurren knurren surren schwirren klirren irren sperren zerren starren scharren hauen brauen stauen
    bauen tauen kauern dauern trauern lauern mauern feuern steuern erneuern-x wandern erobern-x liefern
    opfern zögern weigern steigern ärgern hungern lagern meckern kleckern ackern zuckern futtern schmettern
    wettern blättern klettern zittern knattern schnattern rattern flackern gackern sickern kullern purzeln
    wirbeln kribbeln krabbeln sabbeln babbeln rubbeln knuddeln buddeln nuscheln tuscheln wuscheln muscheln-x
    rätseln wechseln lächeln fächeln hecheln schmeicheln streicheln sicheln-x zweifeln würfeln löffeln
    stiefeln-x schaufeln schnüffeln büffeln tüfteln basteln hasten rasten kosten rosten posten-x fasten
    tasten lasten mästen rüsten wüsten-x flüchten züchten leuchten feuchten-x fürchten richten dichten
    lichten-x schlichten berichten-x be-richten verzichten-x ver-zichten trösten rösten töten löten beten
    kneten jäten spotten trotten stricken sticken nicken picken ticken kicken zwicken blicken flicken
    schmücken bücken jucken spucken zucken drucken ducken hocken locken rocken-x schocken trocken-x strecken
    lecken necken wecken schlecken meckern-x stecken zwecken-x gucken schenken senken tränken schwenken
    ver-senken kränken danken wanken zanken schwanken ranken funken-x dunken tunken parken harken-x
    marken-x stärken merken werken wirken würgen sorgen borgen morgen-x folgen tilgen-x zeugen beugen
    leugnen-x säugen äugen-x zeigen neigen geigen schweigen-x reifen seifen-x greifen-x schleifen-x
    streifen kneifen-x pfeifen-x taufen raufen kaufen laufen-x saufen-x schnaufen häufen-x täuschen
    rauschen plaudern-x zaudern schaudern`).filter(v => !v.endsWith('-x'));

  // ── Starke/unregelmäßige Verben: Grundform | 3. Person (wenn Vokalwechsel) | Präteritum | Partizip
  const STARK = `gehen||ging|gegangen kommen||kam|gekommen laufen|läuft|lief|gelaufen fahren|fährt|fuhr|gefahren
    fallen|fällt|fiel|gefallen fangen|fängt|fing|gefangen halten|hält|hielt|gehalten lassen|lässt|ließ|gelassen
    schlafen|schläft|schlief|geschlafen tragen|trägt|trug|getragen waschen|wäscht|wusch|gewaschen
    wachsen|wächst|wuchs|gewachsen schlagen|schlägt|schlug|geschlagen graben|gräbt|grub|gegraben
    laden|lädt|lud|geladen raten|rät|riet|geraten braten|brät|briet|gebraten blasen|bläst|blies|geblasen
    backen|backt|backte|gebacken essen|isst|aß|gegessen fressen|frisst|fraß|gefressen geben|gibt|gab|gegeben
    lesen|liest|las|gelesen sehen|sieht|sah|gesehen nehmen|nimmt|nahm|genommen sprechen|spricht|sprach|gesprochen
    treffen|trifft|traf|getroffen helfen|hilft|half|geholfen werfen|wirft|warf|geworfen
    sterben|stirbt|starb|gestorben brechen|bricht|brach|gebrochen stechen|sticht|stach|gestochen
    stehlen|stiehlt|stahl|gestohlen vergessen|vergisst|vergaß|vergessen messen|misst|maß|gemessen
    treten|tritt|trat|getreten erschrecken|erschrickt|erschrak|erschrocken schmelzen|schmilzt|schmolz|geschmolzen
    gelten|gilt|galt|gegolten verderben|verdirbt|verdarb|verdorben befehlen|befiehlt|befahl|befohlen
    geschehen|geschieht|geschah|geschehen saufen|säuft|soff|gesoffen stoßen|stößt|stieß|gestoßen
    bleiben||blieb|geblieben schreiben||schrieb|geschrieben steigen||stieg|gestiegen schweigen||schwieg|geschwiegen
    scheinen||schien|geschienen schreien||schrie|geschrien leihen||lieh|geliehen reiben||rieb|gerieben
    treiben||trieb|getrieben beißen||biss|gebissen reißen||riss|gerissen reiten||ritt|geritten
    streiten||stritt|gestritten schneiden||schnitt|geschnitten gleiten||glitt|geglitten greifen||griff|gegriffen
    pfeifen||pfiff|gepfiffen streichen||strich|gestrichen leiden||litt|gelitten heißen||hieß|geheißen
    kneifen||kniff|gekniffen schleichen||schlich|geschlichen schmeißen||schmiss|geschmissen
    entscheiden||entschied|entschieden vergleichen||verglich|verglichen
    fliegen||flog|geflogen fliehen||floh|geflohen fließen||floss|geflossen gießen||goss|gegossen
    schließen||schloss|geschlossen schießen||schoss|geschossen genießen||genoss|genossen riechen||roch|gerochen
    kriechen||kroch|gekrochen ziehen||zog|gezogen biegen||bog|gebogen wiegen||wog|gewogen frieren||fror|gefroren
    verlieren||verlor|verloren bieten||bot|geboten schieben||schob|geschoben lügen||log|gelogen heben||hob|gehoben
    finden||fand|gefunden binden||band|gebunden singen||sang|gesungen springen||sprang|gesprungen
    klingen||klang|geklungen trinken||trank|getrunken sinken||sank|gesunken stinken||stank|gestunken
    schwimmen||schwamm|geschwommen beginnen||begann|begonnen gewinnen||gewann|gewonnen spinnen||spann|gesponnen
    gelingen||gelang|gelungen zwingen||zwang|gezwungen schwingen||schwang|geschwungen
    verschwinden||verschwand|verschwunden
    rennen||rannte|gerannt kennen||kannte|gekannt nennen||nannte|genannt brennen||brannte|gebrannt
    denken||dachte|gedacht bringen||brachte|gebracht stehen||stand|gestanden sitzen||saß|gesessen
    liegen||lag|gelegen bitten||bat|gebeten rufen||rief|gerufen hängen||hing|gehangen`.trim().split(/\s+/);

  // ── Hilfs- und Modalverben, tun, wissen: alle Formen ausgeschrieben
  const FEST = {
    sein: 'bin bist ist sind seid war warst waren wart gewesen sei wäre wärst wären',
    haben: 'habe hast hat haben habt hatte hattest hatten hattet gehabt hätte hättest hätten',
    werden: 'werde wirst wird werden werdet wurde wurdest wurden wurdet geworden würde würdest würden',
    können: 'kann kannst können könnt konnte konntest konnten konntet gekonnt könnte könntest könnten',
    müssen: 'muss musst müssen müsst musste musstest mussten musstet gemusst müsste müssten',
    dürfen: 'darf darfst dürfen dürft durfte durftest durften durftet gedurft dürfte dürften',
    sollen: 'soll sollst sollen sollt sollte solltest sollten solltet gesollt',
    wollen: 'will willst wollen wollt wollte wolltest wollten wolltet gewollt',
    mögen: 'mag magst mögen mögt mochte mochtest mochten mochtet gemocht möchte möchtest möchten möchtet',
    wissen: 'weiß weißt wissen wisst wusste wusstest wussten wusstet gewusst wüsste',
    tun: 'tue tust tut tun tat tatst taten tatet getan',
    // Befehlsformen ohne Endung (nur eindeutige)
    kommen: 'komm', gehen: 'geh', geben: 'gib', nehmen: 'nimm', sehen: 'sieh', lesen: 'lies',
    essen: 'iss', helfen: 'hilf', sprechen: 'sprich', werfen: 'wirf',
  };

  // ── Adjektive (Grundformen). * = Steigerung mit Umlaut (alt → älter)
  const ADJ = W(`
    klein groß* alt* jung* neu schön schlecht lang* kurz* dick dünn schnell langsam laut leise hell dunkel
    warm* kalt* heiß kühl nass trocken sauber schmutzig dreckig lieb nett böse frech brav mutig ängstlich
    fröhlich traurig lustig glücklich wütend müde wach hungrig durstig satt krank* gesund* stark* schwach*
    schwer leicht hart* weich rund eckig spitz stumpf scharf* glatt rau süß sauer salzig bitter lecker frisch
    faul fleißig klug* schlau dumm* reich arm* teuer billig voll leer tief niedrig breit schmal eng weit
    nah* fern früh spät bunt rot blau grün gelb schwarz* weiß braun grau golden silbern hübsch hässlich
    freundlich höflich ehrlich ruhig still wild zahm schüchtern stolz tapfer feige geheim wichtig richtig
    falsch einfach schwierig möglich fertig bereit offen kaputt ganz heil wunderbar toll schlimm schrecklich
    gefährlich sicher vorsichtig neugierig gemütlich bequem herrlich köstlich winzig riesig gewaltig kräftig
    mächtig prächtig lebendig tot zart grob* fein flach steil schief krumm locker fest stabil zerbrechlich
    durchsichtig klar trüb sonnig wolkig windig neblig regnerisch stürmisch eisig frostig heiter feucht
    schwül mild kahl saftig reif roh knusprig fett mager schlank zierlich plump modern altmodisch fremd
    bekannt berühmt beliebt selten häufig ordentlich pünktlich sportlich deutlich herzlich eilig geduldig
    ungeduldig zufrieden unzufrieden dankbar sichtbar essbar witzig komisch seltsam merkwürdig einsam
    gemeinsam langweilig spannend aufregend interessant kostbar wertvoll liebevoll sorgfältig gründlich
    genau echt künstlich natürlich artig frei verschieden ähnlich zornig verliebt erschöpft begeistert
    überrascht erstaunt verrückt bewölkt verschneit geschickt lahm blind taub stumm nackt barfuß-x
    eifrig gierig geizig giftig goldig haarig holprig hügelig kantig klebrig knifflig kuschelig matschig
    molligstachelig-x stachelig steinig stinkig struppig wackelig wuschelig zackig zottelig flauschig
    glitschig rutschig durstig-x schläfrig schattig staubig rostig rosig riesengroß winzigklein blitzschnell
    kunterbunt eiskalt steinhart federleicht todmüde zuckersüß bildschön uralt nagelneu
    gut hoch rosa lila orange super prima extra`).filter(a => !a.endsWith('-x'));

  // ── Funktionswörter: am Satzanfang großgeschrieben, aber keine Nomen
  const FUNKTION = new Set(W(`
    der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines
    mein meine meinen meinem meiner meines dein deine deinen deinem deiner deines sein seine seinen seinem
    seiner seines ihr ihre ihren ihrem ihrer ihres unser unsere unseren unserem unserer euer eure euren
    eurem eurer dieser diese dieses diesen diesem jener jene jenes jeder jede jedes jeden jedem alle allen
    aller alles viele vielen einige einigen manche manchen mancher manches mehrere beide beiden
    ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihn ihnen man wer was wen wem wessen
    wo wohin woher wann warum wieso weshalb wie welche welcher welches welchen welchem
    und oder aber denn sondern doch weil dass ob wenn als bevor nachdem während obwohl damit bis seit
    sobald falls sodass
    in im an am auf aus bei beim mit nach von vom vor zu zum zur über unter neben zwischen hinter durch
    für gegen ohne um wegen trotz ab außer entlang gegenüber ins ans aufs
    nicht nie niemals immer oft manchmal heute gestern morgen übermorgen vorgestern jetzt nun dann danach
    davor zuerst zuletzt schließlich endlich plötzlich bald gleich sofort später früher damals einmal
    zweimal wieder noch schon erst nur auch sehr ziemlich fast etwa ungefähr vielleicht bestimmt leider
    gern gerne lieber hier da dort oben unten vorne vorn hinten links rechts draußen drinnen überall
    nirgends irgendwo irgendwann dorthin hierher weg los zurück weiter zusammen allein alleine so also
    deshalb darum trotzdem außerdem ja nein bitte danke hallo tschüss oh ah au ach hurra juhu pst hm
    null eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf zwanzig dreißig hundert tausend
    erste ersten zweite zweiten dritte dritten mehr weniger viel wenig etwas nichts jemand niemand selbst
    mal eben halt wohl zwar daher dabei dafür dagegen daran darauf daraus darin darüber darunter davon dazu
    woran worauf womit wovon abends morgens mittags nachts nachmittags vormittags montags dienstags
    mittwochs donnerstags freitags samstags sonntags heraus herein hinaus hinein herum hinunter herunter
    hinauf herauf vorbei nachher vorher inzwischen meistens wirklich eigentlich nämlich hoffentlich
    wahrscheinlich übrigens jedoch sogar genug kaum gar besonders mindestens höchstens ungefähr zumindest
    solche solcher solches ander andere anderen anderer anderes paar bisschen
    ob entweder weder noch sowohl je desto umso wobei wodurch wofür statt anstatt innerhalb außerhalb`));
  // Großgeschriebene Anredewörter mitten im Satz: keine Nomen
  const ANREDE = new Set(W('sie ihr ihre ihren ihrem ihrer ihnen du dir dich dein deine deinen deinem deiner euch euer eure'));
  // Wortformen, die fast nie als Verb/Adjektiv gemeint sind
  const NIE = new Set(W('bitte danke weiter später früher lieber ganz gleich eher mal los weg zu'));
  const SUBJEKT = new Set(W('ich du er sie es wir ihr man wer niemand jemand'));
  const HILFS = new Set(W('sein haben werden können müssen dürfen sollen wollen mögen wissen tun'));
  const TRENNBAR = W('zusammen zurück weiter heraus herein hinaus hinein herum herunter hinunter hinauf herauf vorbei fern fort fest nach her hin los mit vor weg auf aus bei ein ab an zu um');
  const UNTRENNBAR = W('be ver er ent zer miss ge');

  // ── Formen erzeugen ─────────────────────────────────────────────
  const VERB = new Map(), ADJF = new Map();          // Form → Grundform
  const add = (map, form, lemma) => { if (form && !map.has(form)) map.set(form, lemma); };
  const eEin = st => /[td]$/.test(st) || /[^aeiouäöülrmnh][mn]$/.test(st);   // arbeit-e-t, regn-e-t
  const zisch = st => /(s|ß|z|x)$/.test(st);

  SCHWACH.forEach(eintrag => {
    const ohneGe = eintrag.includes('-') || eintrag.endsWith('ieren');
    const inf = eintrag.replace('-', '');
    let f;
    if (/(el|er)n$/.test(inf)) {                       // sammeln, wandern
      const st = inf.slice(0, -1);
      f = [st + 'e', st.replace(/e([lr])$/, '$1') + 'e', st + 'st', st + 't', st + 'te', st + 'test', st + 'ten', st + 'tet', (ohneGe ? '' : 'ge') + st + 't'];
    } else {
      const st = inf.slice(0, -2), e = eEin(st) ? 'e' : '';
      f = [st + 'e', st + e + 'st', st + e + 't', st + e + 'te', st + e + 'test', st + e + 'ten', st + e + 'tet', (ohneGe ? '' : 'ge') + st + e + 't'];
      if (!e && zisch(st)) f.push(st + 't');           // du tanzt
    }
    add(VERB, inf, inf); f.forEach(x => add(VERB, x, inf));
  });

  STARK.forEach(z => {
    const [inf, er, prt, part] = z.split('|');
    const st = inf.slice(0, -2), e = eEin(st) ? 'e' : '';
    const f = [st + 'e', st + e + 't', part];
    if (er) f.push(er, er + 'st', er.slice(0, -1) + 'st');                    // läuft, hältst, läufst
    else { f.push(st + e + 'st'); if (zisch(st)) f.push(st + 't'); }
    if (prt.endsWith('te')) f.push(prt, prt + 'st', prt + 'n', prt + 't');    // brachte, backte
    else f.push(prt, prt + 'st', prt + 'est', prt + 'en', prt + 't', prt + 'et');
    add(VERB, inf, inf); f.forEach(x => add(VERB, x, inf));
  });
  Object.keys(FEST).forEach(inf => { add(VERB, inf, inf); W(FEST[inf]).forEach(x => add(VERB, x, inf)); });
  VERB.delete('weiter');

  const END = ['e', 'er', 'es', 'en', 'em'];
  const umlaut = s => { const i = Math.max(s.lastIndexOf('a'), s.lastIndexOf('o'), s.lastIndexOf('u')); return i < 0 ? s : s.slice(0, i) + { a: 'ä', o: 'ö', u: 'ü' }[s[i]] + s.slice(i + 1); };
  const dekl = (stamm, lemma, mitGrund) => { if (mitGrund) add(ADJF, stamm, lemma); END.forEach(x => add(ADJF, stamm + x, lemma)); };
  ADJ.forEach(eintrag => {
    const um = eintrag.endsWith('*'), b = eintrag.replace('*', '');
    if (['rosa', 'lila', 'orange', 'super', 'prima', 'extra'].includes(b)) { add(ADJF, b, b); return; }
    if (b === 'gut') { dekl('gut', b, true); dekl('besser', b, true); dekl('best', b, false); return; }
    if (b === 'hoch') { add(ADJF, 'hoch', b); dekl('hoh', b, false); dekl('höher', b, true); dekl('höchst', b, false); return; }
    let st = b, st2 = null;
    if (b.endsWith('e')) st = b.slice(0, -1);                       // leise → leis-
    else if (b.endsWith('el')) st = b.slice(0, -2) + 'l';           // dunkel → dunkl-
    else if (/(au|eu)er$/.test(b)) st2 = b.slice(0, -2) + 'r';      // teuer → teur- (neben teuer-)
    add(ADJF, b, b);
    dekl(st, b, false); if (st2) dekl(st2, b, false);
    const stU = um ? umlaut(st) : st;
    dekl(stU + 'er', b, true); if (st2) dekl(st2 + 'er', b, true);  // Komparativ
    const sup = b === 'groß' ? 'größt' : b === 'nah' ? 'nächst' : stU + (/(d|t|s|ß|z|x|sch|eu|au|ei)$/.test(stU) ? 'est' : 'st');
    dekl(sup, b, false);                                            // Superlativ
  });
  NIE.forEach(x => { VERB.delete(x); ADJF.delete(x); });

  // ── Nachschlagen ────────────────────────────────────────────────
  // Verb: direkt, sonst mit trennbarer/untrennbarer Vorsilbe (aufräumen, aufgeräumt, aufzuräumen, besucht)
  function verbLemma(w) {
    if (VERB.has(w)) return VERB.get(w);
    for (const p of TRENNBAR) {
      if (!w.startsWith(p) || w.length < p.length + 3) continue;
      const r = w.slice(p.length);
      if (VERB.has(r)) return p + VERB.get(r);
      if (r.startsWith('zu') && VERB.get(r.slice(2)) === r.slice(2)) return p + r.slice(2);
    }
    for (const p of UNTRENNBAR) {
      if (!w.startsWith(p) || w.length < p.length + 3) continue;
      const r = w.slice(p.length);
      if (VERB.has(r)) return p + VERB.get(r);
      if (VERB.has('ge' + r)) return p + VERB.get('ge' + r);      // versprochen ← gesprochen
    }
    return null;
  }
  const ADJ_ENDE = /^(.{3,}?(?:ig|lich|isch|bar|sam|los|haft|voll))(e|er|es|en|em)?$/;
  function adjLemma(w) {
    if (ADJF.has(w)) return ADJF.get(w);
    if (FUNKTION.has(w) || NIE.has(w)) return null;
    const m = w.match(ADJ_ENDE);
    return m && w.length >= 6 ? m[1] : null;
  }

  // woerter: [{wort (ohne Satzzeichen), post (Satzzeichen dahinter), satzanfang, ende (letztes Wort des Satzes)}] → Tags
  const befehl = k => VERB.get(k + 'en') === k + 'en' ? k + 'en' : VERB.get(k + 'n') === k + 'n' ? k + 'n' : null;
  function erkenne(woerter) {
    // Endet der Satz, in dem Wort i steht, mit einem Ausrufezeichen?
    const ausruf = i => { for (let j = i; j < woerter.length; j++) if (woerter[j].ende) return /!/.test(woerter[j].post || ''); return false; };
    return woerter.map((t, i) => {
      const wort = t.wort || '';
      if (!/^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*$/.test(wort)) return '';      // Zahlen, Zeichen
      const k = wort.toLowerCase();
      const gross = wort[0] !== wort[0].toLowerCase();
      const vor = i > 0 ? (woerter[i - 1].wort || '').toLowerCase() : '';
      const nachWort = i + 1 < woerter.length ? (woerter[i + 1].wort || '') : '';
      const nach = nachWort.toLowerCase();
      if (gross && !t.satzanfang) return ANREDE.has(k) ? '' : 'N';            // mitten im Satz groß → Nomen
      if (NIE.has(k)) return '';
      // „sein": Begleiter (sein Hund, sein kleiner Hund) oder Verb
      if (k === 'sein') return !t.ende && ((nachWort && nachWort[0] !== nachWort[0].toLowerCase()) || ADJF.has(nach)) ? '' : 'V';
      const v = verbLemma(k), a = adjLemma(k);
      if (gross) {                                                           // Satzanfang
        if (v && a) return SUBJEKT.has(nach) ? 'V' : 'A';
        // Grundform am Satzanfang: „Essen wir?" (Verb) / „Essen ist fertig." (Nomen)
        if (v) return v === k && !HILFS.has(k) ? (SUBJEKT.has(nach) ? 'V' : 'N') : 'V';
        if (a) return 'A';
        if (FUNKTION.has(k)) return '';
        // Befehlsform ohne Endung am Anfang eines Ausrufs: „Schau mal!" / „Lauf schnell!"
        if (ausruf(i) && befehl(k)) return 'V';
        return 'N';
      }
      if (v && a) return SUBJEKT.has(vor) ? 'V' : 'A';                        // ich liebe / die liebe Oma
      if (v) return 'V';
      if (a) return 'A';
      return '';
    });
  }

  window.wartLexErkenne = erkenne;
  window.wartLexGrundform = (wort, tag) => {
    const k = String(wort || '').toLowerCase();
    if (tag === 'V') return k === 'sein' ? 'sein' : (verbLemma(k) || befehl(k));
    if (tag === 'A') return adjLemma(k);
    return null;
  };
  window.wartLexGroesse = () => ({ verbformen: VERB.size, adjektivformen: ADJF.size });
})();
