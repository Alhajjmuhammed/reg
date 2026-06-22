'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, MinusCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { findChatbotResponse, getSiteSettings } from '@/lib/store'
import type { SiteSettings } from '@/lib/types'
import { useStoreReady, useStoreVersion } from '@/components/store-provider'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  options?: QuickReply[]
}

interface QuickReply {
  label: string
  value: string
}

const QUICK_REPLIES: Record<string, QuickReply[]> = {
  greeting: [
    { label: 'Training Details', value: 'What will I learn?' },
    { label: 'Package Prices', value: 'What are the prices?' },
    { label: 'Registration', value: 'How do I register?' },
    { label: 'Contact Support', value: 'contact' },
  ],
  default: [
    { label: 'View Packages', value: 'What are the prices?' },
    { label: 'Registration', value: 'How do I register?' },
    { label: 'Contact Support', value: 'contact' },
  ],
}

export function WhatsAppChatbot() {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSettings(getSiteSettings())
  }, [storeReady, storeVersion])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setHasBeenOpened(true)
    if (messages.length === 0) {
      // Send greeting message
      setTimeout(() => {
        const greetingMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: `Hello! Welcome to ${settings?.eventName || 'Executive Masterclass'}. I'm here to help you with information about our training program. How can I assist you today?`,
          timestamp: new Date(),
          options: QUICK_REPLIES.greeting,
        }
        setMessages([greetingMessage])
      }, 500)
    }
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const restoreChat = () => {
    setIsMinimized(false)
  }

  const handleSend = (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Process and respond
    setTimeout(() => {
      const botResponse = getBotResponse(messageText)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse.answer,
        timestamp: new Date(),
        options: botResponse.followUp,
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 500)
  }

  const getBotResponse = (query: string): { answer: string; followUp?: QuickReply[] } => {
    const lowerQuery = query.toLowerCase()
    
    // Handle special contact case
    if (lowerQuery === 'contact' || lowerQuery.includes('contact support') || lowerQuery.includes('speak to human')) {
      return {
        answer: `You can reach our team through:\n\nPhone: ${settings?.contactPhone || '+255 712 345 678'}\nEmail: ${settings?.contactEmail || 'info@executivemasterclass.co.tz'}\nWhatsApp: Click the button below to chat with us directly!\n\nOur office hours: ${settings?.officeHours || 'Mon - Fri: 8:00 AM - 6:00 PM'}`,
        followUp: [
          { label: 'View Packages', value: 'What are the prices?' },
          { label: 'Register Now', value: 'How do I register?' },
        ],
      }
    }

    // Try to find a matching QA from the dynamic store
    const matchedQA = findChatbotResponse(lowerQuery)
    if (matchedQA) {
      return {
        answer: matchedQA.answer.replace(/\\n/g, '\n'),
        followUp: QUICK_REPLIES.default,
      }
    }

    // Default response
    return {
      answer: "I'm not sure about that specific question. Here are some topics I can help you with:\n\n- Training details and curriculum\n- Package prices and discounts\n- Payment methods\n- Registration process\n- Group bookings\n\nOr click 'Contact Support' to speak with our team directly!",
      followUp: QUICK_REPLIES.greeting,
    }
  }

  const openWhatsApp = () => {
    const phone = settings?.contactWhatsApp || '255712345678'
    const message = encodeURIComponent(
      `Hello! I'm interested in the ${settings?.eventName || 'Executive Masterclass'}. Please provide more information.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {!hasBeenOpened && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              1
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 h-14 w-72'
              : 'bottom-6 right-6 h-[500px] w-[380px] max-w-[calc(100vw-3rem)]'
          }`}
        >
          <div
            className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
              isMinimized ? 'cursor-pointer' : ''
            }`}
            onClick={isMinimized ? restoreChat : undefined}
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-[#075E54] p-3 text-white">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#075E54] bg-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{settings?.eventName || 'Executive Masterclass'}</h3>
                <p className="text-xs text-white/80">
                  {isTyping ? 'Typing...' : 'Online | Click to chat'}
                </p>
              </div>
              {!isMinimized && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      minimizeChat()
                    }}
                    className="rounded-full p-1.5 hover:bg-white/20"
                    aria-label="Minimize chat"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeChat()
                    }}
                    className="rounded-full p-1.5 hover:bg-white/20"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 bg-[#ECE5DD] dark:bg-[#0d1418] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <div
                          className={`flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`relative max-w-[85%] rounded-lg px-3 py-2 ${
                              message.type === 'user'
                                ? 'bg-[#DCF8C6] text-gray-800 dark:bg-[#005c4b] dark:text-gray-100'
                                : 'bg-white text-gray-800 dark:bg-[#202c33] dark:text-gray-100'
                            }`}
                          >
                            {message.type === 'bot' && (
                              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[#075E54] dark:text-[#25D366]">
                                <Bot className="h-3 w-3" />
                                <span>Assistant</span>
                              </div>
                            )}
                            <p className="whitespace-pre-line text-sm">{message.content}</p>
                            <p className="mt-1 text-right text-[10px] text-gray-500 dark:text-gray-400">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>

                        {/* Quick Replies */}
                        {message.type === 'bot' && message.options && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleSend(option.value)}
                                className="rounded-full border border-[#25D366] bg-white px-3 py-1 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white dark:bg-[#202c33] dark:hover:bg-[#25D366]"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-white px-4 py-3 dark:bg-[#202c33]">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* WhatsApp Button */}
                <div className="border-t border-border bg-white px-4 py-2 dark:bg-[#1f2c33]">
                  <button
                    onClick={openWhatsApp}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2 text-sm font-medium text-white transition-colors hover:bg-[#128C7E]"
                  >
                    <Phone className="h-4 w-4" />
                    Continue on WhatsApp
                  </button>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 border-t border-border bg-white p-3 dark:bg-[#1f2c33]">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 border-none bg-gray-100 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-[#2a3942] dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className="bg-[#25D366] hover:bg-[#128C7E]"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
