const THEORY = {
  'Ввод и вывод': `
<h4>Вывод на экран</h4>
<p><code>print()</code> выводит на экран. Текст пишут в кавычках, числа без кавычек. Каждый <code>print()</code> выводит с новой строки.</p>
<pre class="code">print("Привет, PROFI школа!")
print(5)</pre>
<p>Если перечислить в <code>print</code> несколько значений через запятую, они выведутся в одну строку через пробел:</p>
<pre class="code">name = "Аня"
count = 1
print(name, count)</pre>
<p>На экране: <code>Аня 1</code></p>

<h4>Переменные</h4>
<p>Переменная - коробка с именем. Знак <code>=</code> кладёт в неё значение. Имена переменных пишут латиницей, без пробелов: <code>count</code>, <code>user_name</code>.</p>
<pre class="code">count = 0
count = count + 1</pre>
<p><code>count = count + 1</code>: взять то, что лежит в коробке, прибавить 1 и положить обратно.</p>

<h4>Ввод</h4>
<p><code>input()</code> ждёт, пока человек что-то введёт, и всегда возвращает текст. Каждый <code>input()</code> читает одну строку из поля "Ввод".</p>
<p><code>int(...)</code> превращает текст в целое число, чтобы с ним можно было считать.</p>
<pre class="code">name = input()
age = int(input())
print("Привет, " + name + "!")
print(age + 1)</pre>
<p>Знак <code>+</code> работает по-разному: <code>"2" + "3"</code> склеивает текст и даёт <code>"23"</code>, а <code>2 + 3</code> складывает числа и даёт <code>5</code>.</p>

<h4>Арифметика</h4>
<div class="table-wrap">
<table>
  <tr><th>Знак</th><th>Что делает</th><th>Пример</th></tr>
  <tr><td><code>+</code></td><td>сложение</td><td><code>7 + 2</code> даёт 9</td></tr>
  <tr><td><code>-</code></td><td>вычитание</td><td><code>7 - 2</code> даёт 5</td></tr>
  <tr><td><code>*</code></td><td>умножение</td><td><code>7 * 2</code> даёт 14</td></tr>
  <tr><td><code>/</code></td><td>деление</td><td><code>7 / 2</code> даёт 3.5</td></tr>
  <tr><td><code>//</code></td><td>деление нацело</td><td><code>7 // 2</code> даёт 3</td></tr>
  <tr><td><code>%</code></td><td>остаток от деления</td><td><code>7 % 2</code> даёт 1</td></tr>
</table>
</div>
<p>Как и в математике, сначала выполняется умножение, потом сложение. Скобки меняют порядок: <code>(2 + 3) * 4</code> даёт 20.</p>
`,

  'Условия': `
<h4>Условие: if и else</h4>
<p>Ромб на блок-схеме в Python записывают через <code>if</code>. Если условие верно, выполняются строки под <code>if</code>, иначе строки под <code>else</code>.</p>
<pre class="code">password = input()
if password == "profi2026":
    print("Добро пожаловать!")
else:
    print("Неверный пароль")</pre>
<ul>
  <li>После <code>if</code> и <code>else</code> всегда ставится двоеточие.</li>
  <li>Что выполнится внутри, сдвигается на 4 пробела (клавиша Tab).</li>
  <li>Два знака равно <code>==</code> сравнивают. Один знак <code>=</code> кладёт значение в переменную.</li>
</ul>

<h4>Знаки сравнения</h4>
<div class="table-wrap">
<table>
  <tr><th>Знак</th><th>Значит</th></tr>
  <tr><td><code>==</code></td><td>равно</td></tr>
  <tr><td><code>!=</code></td><td>не равно</td></tr>
  <tr><td><code>&lt;</code> <code>&gt;</code></td><td>меньше, больше</td></tr>
  <tr><td><code>&lt;=</code> <code>&gt;=</code></td><td>не больше, не меньше</td></tr>
</table>
</div>

<h4>Больше двух вариантов: elif</h4>
<p>Если вариантов больше двух, пишут <code>if</code>, потом <code>elif</code>, в конце <code>else</code>. Python проверяет условия сверху вниз и выполняет первую подходящую ветку.</p>
<pre class="code">age = int(input())
if age &lt; 14:
    print("Ребёнок")
elif age &lt; 18:
    print("Подросток")
else:
    print("Взрослый")</pre>

<h4>Остаток от деления в условии</h4>
<p>Знак <code>%</code> даёт остаток от деления. Если остаток равен 0, число делится нацело:</p>
<pre class="code">n = int(input())
if n % 3 == 0:
    print("Делится на 3")
else:
    print("Не делится на 3")</pre>
`,

  'Циклы': `
<h4>while: пока условие верно</h4>
<p>Стрелка назад на блок-схеме - это цикл. Строки со сдвигом повторяются, пока условие верно.</p>
<pre class="code">i = 1
while i &lt;= 3:
    print(i)
    i = i + 1
print("Готово")</pre>
<p>На экране: 1, 2, 3, Готово. Без строки <code>i = i + 1</code> цикл не закончится никогда, и тренажёр остановит программу через несколько секунд.</p>

<h4>for: для каждого по очереди</h4>
<pre class="code">for i in range(1, 6):
    print(i)</pre>
<p><code>range(1, 6)</code> - числа от 1 до 5: последнее число не входит. Чтобы дойти до <code>n</code> включительно, пишут <code>range(1, n + 1)</code>.</p>

<h4>Счётчик в цикле</h4>
<p>Переменную заводят до цикла, а меняют внутри него. Внутри цикла можно писать <code>if</code>, тогда его строки сдвигаются ещё на 4 пробела.</p>
<pre class="code">count = 0
for i in range(1, 11):
    if i % 5 == 0:
        count = count + 1
print(count)</pre>
<p>Программа считает, сколько чисел от 1 до 10 делятся на 5. На экране: 2.</p>

<h4>Списки</h4>
<p>Список - много значений в одной переменной, в квадратных скобках через запятую. <code>for</code> по очереди кладёт в переменную каждый элемент списка.</p>
<pre class="code">authors = ["Иванов", "Петрова", "Иванов", "Смирнов"]
count = 0
for author in authors:
    if author == "Иванов":
        count = count + 1
print(count)</pre>
<p>На экране: 2.</p>
<p><code>input().split()</code> превращает введённую строку <code>Иванов Петрова</code> в список из двух фамилий.</p>
`,
};
