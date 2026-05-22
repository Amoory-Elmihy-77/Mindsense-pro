import streamlit as st
import os
import pandas as pd
import plotly.express as px
from predict import predict_emotion

# Page Configuration
st.set_page_config(
    page_title="MindSense AI - Emotion Recognition",
    page_icon="🎙️",
    layout="centered"
)

# Custom CSS for modern UI
st.markdown("""
<style>
    .main {
        background-color: #0e1117;
    }
    .stApp {
        max-width: 800px;
        margin: 0 auto;
    }
    h1 {
        color: #00d2ff;
        text-align: center;
        font-family: 'Inter', sans-serif;
    }
    .subtitle {
        text-align: center;
        color: #a0aec0;
        margin-bottom: 30px;
    }
    .emotion-box {
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin-top: 20px;
        margin-bottom: 20px;
    }
    .emotion-ANGRY { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); color: white; }
    .emotion-HAPPY { background: linear-gradient(135deg, #fceabb 0%, #f8b500 100%); color: black; }
    .emotion-SAD { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
    .emotion-NEUTRAL { background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); color: black; }
</style>
""", unsafe_allow_html=True)


st.markdown("<h1>🎙️ MindSense AI</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle'>Upload a voice clip to detect the speaker's emotion.</p>", unsafe_allow_html=True)

# File Uploader
uploaded_file = st.file_uploader("Upload an audio file (.wav)", type=['wav'])

if uploaded_file is not None:
    # Save the uploaded file temporarily
    temp_path = "temp_audio.wav"
    with open(temp_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    
    st.audio(temp_path, format='audio/wav')
    
    # Check if model exists
    MODEL_DIR = "./ser_output/final_model"
    if not os.path.exists(MODEL_DIR):
        st.error(f"Model not found at '{MODEL_DIR}'. Please ensure you have trained the model and placed the final_model folder in the correct path.")
    else:
        with st.spinner('Analyzing emotion...'):
            try:
                # Predict
                pred_label, probs = predict_emotion(temp_path, model_dir=MODEL_DIR)
                
                # Display Result
                st.markdown(f"<div class='emotion-box emotion-{pred_label.upper()}'><h2>Detected Emotion: {pred_label.upper()}</h2></div>", unsafe_allow_html=True)
                
                # Plot probabilities
                df_probs = pd.DataFrame({
                    "Emotion": list(probs.keys()),
                    "Probability": list(probs.values())
                })
                
                fig = px.bar(
                    df_probs, 
                    x="Probability", 
                    y="Emotion", 
                    orientation='h',
                    color="Emotion",
                    color_discrete_map={
                        "angry": "#ff4b2b",
                        "happy": "#f8b500",
                        "sad": "#00f2fe",
                        "neutral": "#8ec5fc"
                    }
                )
                fig.update_layout(
                    xaxis_title="Confidence",
                    yaxis_title="",
                    showlegend=False,
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font=dict(color="white")
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
            except Exception as e:
                st.error(f"An error occurred during prediction: {str(e)}")
                
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)
