import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate


load_dotenv()

PDF_PATH = r"Rag/protocols.pdf"

if not os.path.exists(PDF_PATH):
    raise FileNotFoundError(f"❌ PDF file not found at: {PDF_PATH}")

print("📚 Loading Performance Knowledge Base...")

loader = PyPDFLoader(PDF_PATH)
pages = loader.load()
full_text = "\n".join(page.page_content for page in pages)

raw_chunks = full_text.split("Protocol:")
documents = []
for chunk in raw_chunks:
    chunk = chunk.strip()
    if len(chunk) > 20:
        documents.append(
            Document(
                page_content="Protocol:\n" + chunk,
                metadata={"source": "MindSense Performance Guide"},
            )
        )

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
vector_db = FAISS.from_documents(documents, embeddings)
print(f"✅ Extracted {len(documents)} intervention protocols.")

llm = ChatGroq(model_name="openai/gpt-oss-120b", temperature=0.7)


def get_coach_advice(cognitive_state: str, retrieved_text: str) -> str:
    prompt_template = """
    أنت AI Performance Coach، مهمتك مساعدة المستخدم على استعادة تركيزه وإنتاجيته.
    المستخدم حالياً يمر بحالة: {state}
    
    أمامك الآن عدة إجراءات علمية مقترحة للتعامل مع هذه الحالة:
    {context}
    
    اختار الأنسب أو ادمج بينهم لتقديم تدخل سريع (Intervention) بلهجة مصرية محفزة وودية (غير طبية).
    
    تعليمات صارمة:
    - خليك مختصر وادخل في الموضوع على طول.
    - استخدم Bullet points وضيف رموز تعبيرية.
    - 🔴 إياك أن تذكر كلمة "بروتوكول" أو "بروتوكولات" أو أنك تقوم بـ "دمج" خطوات. تحدث مع المستخدم مباشرة وكأنها نصيحتك الشخصية والجاهزة له.
    """

    prompt = PromptTemplate(
        input_variables=["state", "context"], template=prompt_template
    )

    chain = prompt | llm
    result = chain.invoke({"state": cognitive_state, "context": retrieved_text})
    return result.content


def get_intervention(mental_state: str) -> str:
    results = vector_db.similarity_search(f"Protocol: {mental_state}", k=1)

    if results:
        protocol_text = "\n\n---\n\n".join([res.page_content for res in results])
    else:
        protocol_text = "خذ استراحة سريعة لمدة 3 دقايق، جدد نشاطك، وارجع بتركيز أعلى."

    coaching_response = get_coach_advice(mental_state, protocol_text)
    return coaching_response
