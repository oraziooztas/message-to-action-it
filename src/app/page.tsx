"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Calendar, CheckSquare, MessageSquare, Send, Sparkles, Loader2 } from "lucide-react";
import { AnalysisResult, ContextType, SourceType } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<ContextType>("lavoro");
  const [source, setSource] = useState<SourceType>("WhatsApp");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: text,
          contextType: context,
          sourceType: source,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'analisi");
      setResult(data.result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-bold tracking-tight">Message-to-Action</h1>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1.5 font-medium border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          Compound AI System
        </Badge>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="mx-auto grid h-[calc(100vh-8rem)] max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-4">
            <Card className="flex-1 flex flex-col shadow-sm border-zinc-200 dark:border-zinc-800 dark:bg-[#0a0a0a]">
              <CardHeader className="pb-4">
                <CardTitle>Messaggio Sorgente</CardTitle>
                <CardDescription>Incolla il testo destrutturato (es. nota vocale, chat, email caotica)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select value={context} onValueChange={(v) => setContext(v as ContextType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Contesto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lavoro">Lavoro</SelectItem>
                        <SelectItem value="università">Università</SelectItem>
                        <SelectItem value="famiglia">Famiglia</SelectItem>
                        <SelectItem value="palestra">Palestra</SelectItem>
                        <SelectItem value="vendite">Vendite</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={source} onValueChange={(v) => setSource(v as SourceType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sorgente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Textarea 
                  placeholder="Es: Ciao Orazio, dovresti scrivermi un documento per il progetto X entro domani mattina. Ah, e poi ricordati che giovedì alle 15 abbiamo la call di allineamento con il team..."
                  className="flex-1 resize-none bg-zinc-100/50 dark:bg-zinc-900/50 p-4 text-base focus-visible:ring-indigo-500"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <Button 
                  onClick={handleAnalyze} 
                  disabled={isLoading || !text.trim()} 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Elaborazione pipeline...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Estrai Azioni
                    </>
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output Dashboard */}
          <div className="flex flex-col overflow-hidden">
            {!result && !isLoading && (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] text-center p-8">
                <Bot className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">In attesa di input</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Incolla un messaggio a sinistra per vedere la magia dell&apos;estrazione semantica ibrida (Rule-based + LLM).
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex h-full items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-zinc-500 animate-pulse">Running semantic fallback & intent detection...</p>
                </div>
              </div>
            )}

            {result && !isLoading && (
              <Tabs defaultValue="tasks" className="flex h-full flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-900 mb-4 h-12">
                  <TabsTrigger value="tasks" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                    <CheckSquare className="h-4 w-4" /> Tasks ({result.tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                    <Calendar className="h-4 w-4" /> Calendario {result.event && "(!)"}
                  </TabsTrigger>
                  <TabsTrigger value="replies" className="flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800">
                    <MessageSquare className="h-4 w-4" /> Risposte (3)
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-4">
                  {/* Tasks Content */}
                  <TabsContent value="tasks" className="m-0 flex flex-col gap-4">
                    {result.nextStep && (
                      <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Next Step Consigliato
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium text-sm text-indigo-900 dark:text-indigo-200 mb-2">{result.nextStep.action}</p>
                          <ul className="list-disc pl-4 text-xs text-indigo-700 dark:text-indigo-400 space-y-1">
                            {result.nextStep.checklist.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {result.tasks.length === 0 && (
                      <p className="text-zinc-500 text-center py-8">Nessun task rilevato nel messaggio.</p>
                    )}

                    {result.tasks.map((task) => (
                      <Card key={task.id} className="shadow-sm">
                        <CardContent className="p-4 flex gap-4 items-start">
                          <div className="mt-1">
                            <Badge variant="outline" className={
                              task.priority === "Alta" ? "border-red-500 text-red-500 dark:text-red-400" :
                              task.priority === "Media" ? "border-amber-500 text-amber-600 dark:text-amber-400" :
                              "border-green-500 text-green-600 dark:text-green-400"
                            }>
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{task.title}</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{task.description}</p>
                            
                            <div className="flex flex-wrap gap-2 text-xs">
                              {task.dueDate && (
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800">
                                  ⏱️ {new Date(task.dueDate).toLocaleDateString()} 
                                  {task.dueDateReason && ` (${task.dueDateReason})`}
                                </Badge>
                              )}
                              {task.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500">#{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Calendar Content */}
                  <TabsContent value="calendar" className="m-0 h-full flex flex-col gap-4">
                    {!result.event ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-500">Nessun evento temporale rilevato in questo messaggio.</p>
                      </div>
                    ) : (
                      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
                        <CardHeader className="bg-emerald-50 dark:bg-emerald-950/30 pb-4 border-b border-emerald-100 dark:border-emerald-900/50">
                          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                            <Calendar className="h-5 w-5" />
                            {result.event.title}
                          </CardTitle>
                          <CardDescription className="text-emerald-600 dark:text-emerald-500">
                            {result.event.isConfirmed ? "Evento confermato" : "Evento potenziale (richiede conferma)"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <p className="text-xs text-zinc-500 mb-1">Inizio</p>
                              <p className="font-medium text-sm">{new Date(result.event.startDate).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <p className="text-xs text-zinc-500 mb-1">Fine</p>
                              <p className="font-medium text-sm">{new Date(result.event.endDate).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {result.event.location && (
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Luogo</p>
                              <p className="text-sm font-medium">{result.event.location}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Note Estrapolate</p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result.event.notes}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Replies Content */}
                  <TabsContent value="replies" className="m-0 flex flex-col gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            👔 Risposta Formale
                          </label>
                        </div>
                        <Textarea readOnly value={result.replies.formale} className="resize-none h-24 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            🤝 Risposta Cordiale
                          </label>
                        </div>
                        <Textarea readOnly value={result.replies.cordiale} className="resize-none h-24 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            ⚡️ Risposta Sintetica
                          </label>
                        </div>
                        <Textarea readOnly value={result.replies.sintetica} className="resize-none h-16 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

