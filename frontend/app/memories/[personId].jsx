import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Image, FlatList, Dimensions,
  TouchableOpacity, ActivityIndicator, Animated, Modal, Pressable,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useFonts } from "expo-font";
import { api } from "../../services/api";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(height * 0.5);
const SPACING = 1;
const COLUMNS = width >= 768 ? 5 : width >= 430 ? 4 : 3;
const CELL = Math.floor((width - SPACING * (COLUMNS + 1)) / COLUMNS);

export default function PersonMemories() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const displayName = params.name || "Memories";

  const [fontsLoaded] = useFonts({
    Courgette: require("@/assets/fonts/Courgette-Regular.ttf"),
  });

  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [personData, setPersonData] = useState(null);

  const fade = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const indexRef = useRef(0);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerListRef = useRef(null);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems?.length) setViewerIndex(viewableItems[0].index ?? 0);
  });

  const loadPersonData = async () => {
    try {
      const result = await api.getPersonDetails(params.personId);
      setPersonData(result);
    } catch (error) {
      console.error("Error loading person data:", error);
    }
  };

  const loadMedia = async () => {
    try {
      setLoading(true);
      const result = await api.getPersonMedia(params.personId);
      if (result.media) {
        setMedia(result.media.filter(m => m.type === "image"));
      } else {
        setMedia([]);
      }
    } catch (error) {
      console.error("Error loading media:", error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (params.personId) {
        loadPersonData();
        loadMedia();
      }
    }, [params.personId])
  );

  const goTo = (nextIndex) => {
    Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setIndex(nextIndex);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (!media.length) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % media.length;
      goTo(next);
    }, 2000);
    return clearTimer;
  }, [media]);

  useEffect(() => { indexRef.current = index; }, [index]);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const current = media[index];

  const openViewerAt = (startIndex) => {
    clearTimer();
    setViewerIndex(startIndex);
    setViewerVisible(true);
    requestAnimationFrame(() => {
      try { viewerListRef.current?.scrollToIndex({ index: startIndex, animated: false }); } catch {}
    });
  };

  const renderHero = () => {
    if (!current) return null;
    return (
      <Animated.View style={[styles.hero, { opacity: fade }]}>
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backTxt}>‹</Text>
          </TouchableOpacity>

          <View pointerEvents="none" style={styles.heroHeaderCenterInRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.heroHeaderTitle,
                fontsLoaded && styles.heroHeaderTitleCourgette,
              ]}
            >
              {displayName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/edit-person",
                params: {
                  personId: params.personId,
                  name: personData?.name ?? "",
                  relationship: personData?.relationship ?? "",
                  age: personData?.age ?? "",
                  notes: personData?.notes ?? "",
                },
              })
            }
            style={styles.editBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.editTxt}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Pressable onPress={() => openViewerAt(index)} style={styles.fill}>
          <Image source={{ uri: current.uri }} style={styles.fill} resizeMode="cover" />
        </Pressable>
      </Animated.View>
    );
  };

  const renderThumb = ({ item, index: thumbIndex }) => {
    const selected = thumbIndex === index;
    const thumbUri = item.thumb || item.uri;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openViewerAt(thumbIndex)}
        style={[styles.thumbWrap, selected && styles.thumbSelected]}
      >
        <Image source={{ uri: thumbUri }} style={styles.thumb} />
      </TouchableOpacity>
    );
  };

  const renderViewerItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setViewerVisible(false)}
      style={{ width, height, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}
    >
      <Image source={{ uri: item.uri }} style={{ width, height, resizeMode: "contain" }} />
    </TouchableOpacity>
  );

  const getItemLayout = (_, i) => ({ length: width, offset: width * i, index: i });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        {loading ? (
          <View style={[styles.hero, styles.center]}><ActivityIndicator /></View>
        ) : media.length === 0 ? (
          <View style={[styles.hero, styles.center]}><Text style={{ color: "#666" }}>No photos yet</Text></View>
        ) : (
          renderHero()
        )}

        <FlatList
          data={media}
          keyExtractor={(i) => i.id}
          renderItem={renderThumb}
          numColumns={COLUMNS}
          contentContainerStyle={styles.gridContent}
          removeClippedSubviews
          initialNumToRender={24}
          windowSize={11}
          refreshing={loading}
          onRefresh={loadMedia}
        />
        
        {/* Camera FAB */}
        <TouchableOpacity 
          style={styles.cameraFab}
          onPress={() => router.push('/simple-camera')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cameraFabIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={viewerVisible} animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerRoot}>
          <View style={styles.viewerTopBar}>
            <Text style={styles.viewerCounter}>{viewerIndex + 1}/{media.length}</Text>
            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
              style={styles.viewerCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.viewerCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            ref={viewerListRef}
            data={media}
            keyExtractor={(i) => i.id}
            renderItem={renderViewerItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={getItemLayout}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7FF" },
  hero: { width: "100%", height: HERO_HEIGHT, backgroundColor: "#000", overflow: "hidden" },
  fill: { width: "100%", height: "100%" },

  heroHeaderRow: {
    position: "absolute",
    zIndex: 11,
    top: 60,
    left: 0, right: 0,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  heroHeaderCenterInRow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  backTxt: { color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 22 },

  heroHeaderTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  heroHeaderTitleCourgette: {
    fontFamily: "Courgette",
  },

  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  editTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },

  center: { alignItems: "center", justifyContent: "center" },

  thumbWrap: {
    width: CELL,
    height: CELL,
    margin: SPACING / 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbSelected: {
    borderWidth: 2,
    borderColor: "#7C4DFF",
  },
  thumb: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
  },

  gridContent: {
    padding: SPACING / 2,
    paddingBottom: 100,
  },

  viewerRoot: {
    flex: 1,
    backgroundColor: "black",
  },
  viewerTopBar: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 40,
  },
  viewerCounter: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  viewerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCloseTxt: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  
  cameraFab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C4DFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  cameraFabIcon: {
    fontSize: 24,
  },
});