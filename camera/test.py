import sounddevice as sd

print(sd.query_devices())

info = sd.query_devices(6, 'input')   # device index 6 = NexiGo mic
print(info)
