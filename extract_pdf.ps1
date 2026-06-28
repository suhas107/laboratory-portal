$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("c:\Users\suhas\OneDrive\Desktop\web portal\Problem Statement-2.pdf")
$text = ""
foreach ($para in $doc.Paragraphs) {
    $text += $para.Range.Text + "`n"
}
$text | Out-File -FilePath "c:\Users\suhas\OneDrive\Desktop\web portal\problem_statement.txt" -Encoding UTF8
$doc.Close()
$word.Quit()
