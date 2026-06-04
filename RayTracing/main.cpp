#include "rtweekend.h"

#include "camera.h"
#include "hittable.h"
#include "hittable_list.h"
#include "material.h"
#include "sphere.h"

int main() {
    hittable_list world;

    auto snow          = make_shared<lambertian>(color(0.93, 0.95, 1.00));
    auto snow_shadow   = make_shared<lambertian>(color(0.82, 0.86, 0.95));
    auto black_feather = make_shared<lambertian>(color(0.06, 0.07, 0.09));
    auto belly_white   = make_shared<lambertian>(color(0.97, 0.97, 0.95));
    auto beak_orange   = make_shared<lambertian>(color(0.92, 0.55, 0.18));
    auto carrot        = make_shared<lambertian>(color(0.90, 0.42, 0.10));
    auto coal          = make_shared<metal>(color(0.15, 0.15, 0.16), 0.02);
    auto water         = make_shared<metal>(color(0.45, 0.68, 0.85), 0.03);
    auto ice_blue      = make_shared<dielectric>(1.31);
    auto scarf_red     = make_shared<lambertian>(color(0.75, 0.12, 0.14));
    auto hat_red       = make_shared<lambertian>(color(0.72, 0.10, 0.12));
    auto pink_cheek    = make_shared<lambertian>(color(0.93, 0.70, 0.75));

    world.add(make_shared<sphere>(point3(0, -1000.0, 0), 1000.0, snow));

    world.add(make_shared<sphere>(point3(-2.8, -0.28, -1.4), 0.35, snow_shadow));
    world.add(make_shared<sphere>(point3(-1.4, -0.32,  1.6), 0.28, snow_shadow));
    world.add(make_shared<sphere>(point3( 1.5, -0.30, -1.8), 0.30, snow_shadow));
    world.add(make_shared<sphere>(point3( 3.2, -0.26,  0.9), 0.34, snow_shadow));

    // left side water
    world.add(make_shared<sphere>(point3(-3.8, -1000.45, 2.8), 999.45, water));

    // a few ice chunks near the left water
    world.add(make_shared<sphere>(point3(-4.7, 0.11, 2.3), 0.12, ice_blue));
    world.add(make_shared<sphere>(point3(-4.2, 0.15, 2.8), 0.15, ice_blue));
    world.add(make_shared<sphere>(point3(-3.5, 0.10, 3.2), 0.10, ice_blue));
    world.add(make_shared<sphere>(point3(-2.9, 0.18, 2.6), 0.18, ice_blue));

    point3 penguin_center(0.0, 1.05, 0.3);

    world.add(make_shared<sphere>(penguin_center, 1.05, black_feather));

    world.add(make_shared<sphere>(point3(0.0, 0.82, 1.02), 0.62, belly_white));

    // bigger white face circle near eyes
    world.add(make_shared<sphere>(point3(0.0, 1.47, 0.93), 0.50, belly_white));

    world.add(make_shared<sphere>(point3(-0.92, 1.02, 0.38), 0.34, black_feather));
    world.add(make_shared<sphere>(point3( 0.92, 1.02, 0.38), 0.34, black_feather));

    // eyes farther apart
    world.add(make_shared<sphere>(point3(-0.24, 1.60, 1.27), 0.07, coal));
    world.add(make_shared<sphere>(point3( 0.24, 1.60, 1.27), 0.07, coal));

    world.add(make_shared<sphere>(point3(0.0, 1.36, 1.34), 0.09, beak_orange));
    world.add(make_shared<sphere>(point3(0.0, 1.27, 1.30), 0.07, beak_orange));

    world.add(make_shared<sphere>(point3(-0.32, 1.35, 1.15), 0.08, pink_cheek));
    world.add(make_shared<sphere>(point3( 0.32, 1.35, 1.15), 0.08, pink_cheek));

    world.add(make_shared<sphere>(point3(-0.28, 0.06, 0.70), 0.14, beak_orange));
    world.add(make_shared<sphere>(point3( 0.28, 0.06, 0.70), 0.14, beak_orange));

    point3 snowman_base(2.45, 0.55, 0.45);

    world.add(make_shared<sphere>(snowman_base, 0.55, snow));
    world.add(make_shared<sphere>(point3(2.45, 1.30, 0.45), 0.38, snow));
    world.add(make_shared<sphere>(point3(2.45, 1.83, 0.45), 0.27, snow));

    world.add(make_shared<sphere>(point3(2.37, 1.89, 0.69), 0.03, coal));
    world.add(make_shared<sphere>(point3(2.53, 1.89, 0.69), 0.03, coal));

    world.add(make_shared<sphere>(point3(2.35, 1.77, 0.68), 0.02, coal));
    world.add(make_shared<sphere>(point3(2.45, 1.73, 0.70), 0.02, coal));
    world.add(make_shared<sphere>(point3(2.55, 1.77, 0.68), 0.02, coal));

    world.add(make_shared<sphere>(point3(2.45, 1.82, 0.74), 0.045, carrot));

    world.add(make_shared<sphere>(point3(2.45, 1.35, 0.83), 0.04, coal));
    world.add(make_shared<sphere>(point3(2.45, 1.14, 0.90), 0.04, coal));
    world.add(make_shared<sphere>(point3(2.45, 0.94, 0.87), 0.04, coal));

    // red beanie
    world.add(make_shared<sphere>(point3(2.45, 2.06, 0.45), 0.19, hat_red));
    world.add(make_shared<sphere>(point3(2.45, 1.98, 0.45), 0.24, hat_red));

    // scarf wrapped more around neck
    world.add(make_shared<sphere>(point3(2.45, 1.57, 0.58), 0.15, scarf_red));
    world.add(make_shared<sphere>(point3(2.31, 1.56, 0.53), 0.12, scarf_red));
    world.add(make_shared<sphere>(point3(2.59, 1.56, 0.53), 0.12, scarf_red));
    world.add(make_shared<sphere>(point3(2.45, 1.57, 0.34), 0.12, scarf_red));
    world.add(make_shared<sphere>(point3(2.28, 1.42, 0.69), 0.09, scarf_red));
    world.add(make_shared<sphere>(point3(2.20, 1.24, 0.73), 0.08, scarf_red));

    camera cam;

    cam.aspect_ratio      = 16.0 / 9.0;
    cam.image_width       = 1000;
    cam.samples_per_pixel = 50;
    cam.max_depth         = 12;

    cam.vfov     = 28;
    cam.lookfrom = point3(7.2, 2.8, 9.8);
    cam.lookat   = point3(0.9, 1.1, 0.9);
    cam.vup      = vec3(0, 1, 0);

    cam.defocus_angle = 0.25;
    cam.focus_dist    = 10.5;

    cam.render(world);
}