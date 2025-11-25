class AudioInput:
    def __init__(self):
        pass

    def record(self, duration: int = 5) -> bytes:
        """
        TODO: Implement audio recording.
        This should record audio from the microphone for the specified duration.
        """
        print("[System] Audio recording is not yet implemented.")
        return b""

    def transcribe(self, audio_data: bytes) -> str:
        """
        TODO: Implement audio transcription.
        This should use an STT (Speech-to-Text) service to convert audio to text.
        """
        print("[System] Audio transcription is not yet implemented.")
        return ""
