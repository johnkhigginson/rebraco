using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialRentalDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "rebraco");

            migrationBuilder.CreateTable(
                name: "Inquiries",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PropertyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UnitId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UnitName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    PreferredMoveInDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PreferredLeaseTerm = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inquiries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InquiryNotes",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InquiryId = table.Column<int>(type: "int", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InquiryNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InquiryNotes_Inquiries_InquiryId",
                        column: x => x.InquiryId,
                        principalSchema: "rebraco",
                        principalTable: "Inquiries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_CreatedAt",
                schema: "rebraco",
                table: "Inquiries",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_Email",
                schema: "rebraco",
                table: "Inquiries",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_PropertyId",
                schema: "rebraco",
                table: "Inquiries",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Inquiries_Status",
                schema: "rebraco",
                table: "Inquiries",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InquiryNotes_InquiryId",
                schema: "rebraco",
                table: "InquiryNotes",
                column: "InquiryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InquiryNotes",
                schema: "rebraco");

            migrationBuilder.DropTable(
                name: "Inquiries",
                schema: "rebraco");
        }
    }
}
