import cv2
import math
import time
import mediapipe as mp

# -------------------------------
def calculate_distance(p1, p2):
    x1, y1 = p1.x, p1.y
    x2, y2 = p2.x, p2.y
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

# -------------------------------
def calculate_ear(eye_landmarks):
    A = calculate_distance(eye_landmarks[1], eye_landmarks[5])
    B = calculate_distance(eye_landmarks[2], eye_landmarks[4])
    C = calculate_distance(eye_landmarks[0], eye_landmarks[3])

    if C == 0:
        return 0

    ear = (A + B) / (2.0 * C)
    return ear

# -------------------------------
face_mesh = mp.solutions.face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

EAR_THRESHOLD = 0.25
CONSECUTIVE_FRAMES = 15

frame_count = 0
ear_history = []

prev_time = 0

cap = cv2.VideoCapture(0)

print("System Started... Press 'q' to exit.")


while cap.isOpened():

    success, image = cap.read()
    if not success:
        continue

    image.flags.writeable = False
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(image_rgb)

    image.flags.writeable = True
    image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

    h, w, _ = image.shape

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark

            def get_coords(indices):
                return [landmarks[i] for i in indices]

            left_eye = get_coords(LEFT_EYE)
            right_eye = get_coords(RIGHT_EYE)

            left_ear = calculate_ear(left_eye)
            right_ear = calculate_ear(right_eye)

            avg_ear = (left_ear + right_ear) / 2.0

            ear_history.append(avg_ear)

            if len(ear_history) > 5:
                ear_history.pop(0)

            avg_ear = sum(ear_history) / len(ear_history)

            for idx in LEFT_EYE + RIGHT_EYE:
                x = int(landmarks[idx].x * w)
                y = int(landmarks[idx].y * h)
                cv2.circle(image, (x, y), 2, (0, 255, 0), -1)

            cv2.putText(
                image,
                f'EAR: {avg_ear:.2f}',
                (30, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 255, 255),
                2
            )

            if avg_ear < EAR_THRESHOLD:
                frame_count += 1

                if frame_count >= CONSECUTIVE_FRAMES:
                    cv2.putText(
                        image,
                        "DROWSY ALERT!",
                        (100, 200),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1.5,
                        (0, 0, 255),
                        3
                    )
                    print("ALERT: Driver is Drowsy!")
            else:
                frame_count = 0

    current_time = time.time()
    fps = 1 / (current_time - prev_time) if prev_time != 0 else 0
    prev_time = current_time

    cv2.putText(
        image,
        f'FPS: {int(fps)}',
        (30, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.imshow("Driver Safety System", image)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()