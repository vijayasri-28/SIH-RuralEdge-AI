import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { sendAdvisorChatMessage } from '../services/api';
import {
  X,
  Mic,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  Loader2
} from 'lucide-react';

interface VoiceAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  feasibilityData?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  citations?: string[];
}

export const VoiceAdvisorModal: React.FC<VoiceAdvisorModalProps> = ({ isOpen, onClose, feasibilityData }) => {
  const { language, t, isListening, startVoiceInput, stopVoiceInput, speakText } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([
    'What documents are needed for SC certificate verification?',
    'How do I contact my local State Channelising Agency (SCA)?',
    'How is the moratorium interest calculated?'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMap: Record<string, string> = {
        hi: 'नमस्ते! मैं आपका ग्रामीण उद्यम मित्र हूँ। आप NSFDC योजनाओं, ब्याज दरों, और आवश्यक दस्तावेजों के बारे में हिंदी या अपनी मातृभाषा में पूछ सकते हैं।',
        te: 'నమస్కారం! నేను మీ గ్రామీణ వ్యాపార సలహాదారుని. NSFDC పథకాలు, వడ్డీ రేట్లు మరియు దరఖాస్తు విధానం గురించి నన్ను అడగవచ్చు.',
        ta: 'வணக்கம்! நான் உங்கள் கிராமப்புற தொழில் ஆலோசகர். NSFDC திட்டங்கள் மற்றும் கடன் விண்ணப்பம் பற்றி கேளுங்கள்.',
        mr: 'नमस्कार! मी आपला ग्रामीण व्यवसाय मित्र आहे. NSFDC योजना आणि कर्ज प्रक्रियेबद्दल मला विचारा.',
        bn: 'নমস্কার! আমি আপনার গ্রামীণ ব্যবসা উপদেষ্টা। NSFDC স্কিম ও ঋণ আবেদন সম্পর্কে জানতে প্রশ্ন করুন।',
        kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಗ್ರಾಮೀಣ ವ್ಯಾಪಾರ ಸಲಹೆಗಾರ. NSFDC ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.',
        en: 'Hello! I am your Rural Enterprise Advisor. Ask me anything about NSFDC loan structuring, interest rates, and required documentation.'
      };
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: welcomeMap[language] || welcomeMap['en']
        }
      ]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await sendAdvisorChatMessage({
        report_id: feasibilityData?.report_id,
        language: language,
        user_message: textToSend,
        conversation_history: history,
        feasibility_context: feasibilityData
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply_text,
        citations: res.evidence_citations
      };

      setMessages((prev) => [...prev, botMsg]);
      if (res.suggested_quick_questions?.length > 0) {
        setQuickQuestions(res.suggested_quick_questions);
      }

      // Automatically speak reply if language is set
      speakText(res.reply_text);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Sorry, I could not process your query at this moment. Please check your internet connection.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput((transcript) => {
        setInputText(transcript);
        handleSendMessage(transcript);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl h-[620px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <span>{t('voice_assistant')}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-emerald-200">Grounded Multilingual Indic Advisor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  AI
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                {msg.sender === 'bot' && (
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <button
                      onClick={() => speakText(msg.text)}
                      className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </button>

                    {msg.citations && msg.citations.length > 0 && (
                      <span className="truncate max-w-[200px]" title={msg.citations.join(', ')}>
                        Source: {msg.citations[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>Grounded advisor is reasoning in {language}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 font-medium px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Speak into microphone"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={`Ask in ${language.toUpperCase()} (e.g. How to apply at SCA?)...`}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />

          <button
            type="button"
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
