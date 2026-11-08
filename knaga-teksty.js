/* Śliska News – domyślne teksty Knagi (maskotki). Właściciel może je zmieniać w panelu: dev.sliska.pl → Gry i Knaga.
   Format: kategoria → lista [strój, tekst]. Stroje: ziomek, sliska, redaktor, gwiazdor, ikona, surfer, niesmiala, wsciekla,
   zakochana, diabelek, imprezowa, detektyw, uwodziciel, szlafrok, sauna, kapiel, kowboj, ratownik, mikolaj, super, kibic. */
window.KNAGA_CATS = [
  ['shy', 'Nieśmiała (zanim ktoś przeczyta pierwszy artykuł)'],
  ['reveal', 'Odsłonięcie (po pierwszym przeczytanym artykule)'],
  ['home', 'Strona główna'],
  ['article', 'W trakcie czytania artykułu'],
  ['done', 'Po przeczytaniu artykułu do końca'],
  ['comments', 'Przy komentarzach'],
  ['drama', 'Dramy i osie czasu dram'],
  ['games', 'Śliskie Gry'],
  ['level', 'Ranking sezonu i poziomy'],
  ['morning', 'Rano (5:00–10:00)'],
  ['night', 'Noc (23:00–5:00)'],
  ['tip', 'Zgłoś temat'],
  ['spot', 'Wyślij reklamę']
];
window.KNAGA_LINES = {
  shy: [
    ['niesmiala', 'Cześć… jestem Knaga. Przeczytaj jakiś artykuł do końca, to się pokażę. 🙈'],
    ['niesmiala', 'Nie patrz tak… najpierw coś przeczytaj.'],
    ['niesmiala', 'Jeszcze się wstydzę. Jeden artykuł i jestem cała Twoja.'],
    ['niesmiala', 'Schowałam się, bo jesteś tu nowy. Przewiń jakiś tekst do końca, to wyjdę.'],
    ['niesmiala', 'Mama mówiła, żeby nie pokazywać się obcym. Poczytaj chwilę, to przestaniesz być obcy.'],
    ['niesmiala', 'Psst… to ja tak wyglądam w kapturku. Wyjdę po pierwszym artykule.']
  ],
  reveal: [
    ['imprezowa', 'TADAM! Przeczytane, więc się odsłaniam. Od teraz będę Ci tu czasem mokro komentować. 💦'],
    ['imprezowa', 'No i jestem cała! Dzięki, że doczytałeś. Teraz już nie ma odwrotu. 💦'],
    ['uwodziciel', 'Odsłonięta specjalnie dla Ciebie. Zapamiętam to.']
  ],
  home: [
    ['ziomek', 'Siema! Co dziś czytamy?'],
    ['sliska', 'Ale dziś mokro na scenie…'],
    ['detektyw', 'Coś mi tu śmierdzi plotką. Przewiń niżej.'],
    ['gwiazdor', 'Zero wtop od wczoraj. Na razie.'],
    ['kibic', 'Śliska gola! Nowe artykuły wpadły.'],
    ['diabelek', 'Ktoś tu dziś będzie miał bardzo zły dzień. I bardzo dobre zasięgi.'],
    ['redaktor', 'Redakcja nie śpi. Ja też nie. Dramy same się nie opiszą.'],
    ['uwodziciel', 'Wróciłeś? Wiedziałam, że nie wytrzymasz bez plotek.'],
    ['sliska', 'Uwaga, ślisko. Tu się łatwo wciągnąć na godzinę.'],
    ['detektyw', 'Pierwszy artykuł od góry? Ja bym zaczęła od tego z największą liczbą komentarzy.'],
    ['ziomek', 'Na scenie jak zwykle: ktoś kogoś obraził, ktoś coś usunął, ktoś ma nową płytę.'],
    ['gwiazdor', 'Jak nie ma Cię w artykułach, to nie istniejesz. Taka branża.']
  ],
  article: [
    ['redaktor', 'Mocny tekst. Dawaj do końca!'],
    ['zakochana', 'O, ten news mi się podoba.'],
    ['diabelek', 'Pod tym będzie się działo w komentarzach…'],
    ['wsciekla', 'NO JAK ON MÓGŁ?!'],
    ['uwodziciel', 'Czytasz mnie jak otwartą księgę…'],
    ['detektyw', 'Czytaj między wierszami. Tam jest najlepsze.'],
    ['sliska', 'Uff, gorący temat. Aż się spociłam.'],
    ['diabelek', 'Ciekawe, ile godzin do sprostowania. Obstawiam trzy.'],
    ['ziomek', 'Dobra, dojedź do końca, potem pogadamy w komentarzach.'],
    ['redaktor', 'Źródła sprawdzone. Emocje – nie bardzo.']
  ],
  done: [
    ['imprezowa', 'Przeczytane do końca! Szacun.'],
    ['super', 'Kolejny przeczytany. Super czytelnik!'],
    ['zakochana', 'Do końca? Ale z Ciebie Ślizgacz. 💖'],
    ['gwiazdor', 'Do końca doczytuje tylko elita. Witaj w klubie.'],
    ['diabelek', 'No to teraz napisz w komentarzu, co o tym myślisz. Ostro.'],
    ['ratownik', 'Przetrwałeś cały tekst. Ratownik nie był potrzebny.']
  ],
  comments: [
    ['diabelek', 'O, komentarze. Tu dopiero zaczyna się prawdziwy artykuł.'],
    ['wsciekla', 'Spokojnie, kultura! Ale możesz trochę popiszczeć.'],
    ['detektyw', 'Oznacz kogoś przez @nick, niech też się zmoczy.'],
    ['kibic', 'Najlepszy komentarz ląduje na samej górze. Walcz o złotą ramkę!']
  ],
  drama: [
    ['wsciekla', 'Drama w odcinkach. Lepsze niż serial.'],
    ['detektyw', 'Oś czasu dramy: kto, komu, kiedy i za ile.'],
    ['diabelek', 'Ta afera ma więcej odsłon niż ja ubrań.'],
    ['sauna', 'Gorąco jak w saunie. Czytaj od początku, żeby się nie pogubić.']
  ],
  games: [
    ['surfer', 'Zagrajmy! Rekordy czekają.'],
    ['imprezowa', 'Psst… stuknij mnie kilka razy w nagłówku Gier.'],
    ['super', 'Pobij swój rekord, dasz radę!'],
    ['kowboj', 'Szybki palec, mokre czoło. Kto pierwszy, ten lepszy.'],
    ['diabelek', 'Ślizgle dziś łatwe. Żartuję. Powodzenia.'],
    ['kibic', 'Za każdy rekord masz XP. Za każdą porażkę – moje współczucie.']
  ],
  level: [
    ['kibic', 'Ranking sezonu! Kto dziś przewodzi stawce?'],
    ['gwiazdor', 'Legenda Śliskiej to 5000 XP. Ja mam więcej, ale nie liczę.'],
    ['super', 'Czytaj, komentuj, graj – i wspinaj się po poziomach.']
  ],
  morning: [
    ['szlafrok', 'Dzień dobry… kawa jest? Bo plotki już są.'],
    ['kapiel', 'Poranny prysznic z newsami. Najlepiej na mokro.'],
    ['ziomek', 'Rano najlepiej wchodzą świeże dramy.']
  ],
  night: [
    ['szlafrok', 'Jeszcze nie śpisz? Ja też nie…'],
    ['kapiel', 'Nocna kąpiel w newsach. Mokro.'],
    ['sauna', 'Gorąco tu o tej porze, czy to te plotki?'],
    ['uwodziciel', 'O tej porze czytają tylko najwierniejsi. I najbardziej śliscy.'],
    ['szlafrok', 'Jeszcze jeden artykuł i spać. Każdy tak mówi.']
  ],
  tip: [
    ['detektyw', 'Masz temat? Dawaj, Knaga zachowa dyskrecję.'],
    ['diabelek', 'Ktoś coś odwalił? Zgłoś, a my zrobimy z tego newsa.'],
    ['detektyw', 'Zdjęcie, screen, link – im więcej dowodów, tym szybciej piszemy.']
  ],
  spot: [
    ['gwiazdor', 'Reklama za darmo? U nas tak. Dawaj grafikę!'],
    ['imprezowa', 'Twój numer na Śliskiej? Zrób to. Ludzie tu przewijają godzinami.']
  ]
};
